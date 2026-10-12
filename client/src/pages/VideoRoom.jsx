import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Skeleton } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function VideoRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [peerPresent, setPeerPresent] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const roomRef = useRef('');
  const joinedRef = useRef(false);

  const cleanup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (socket && roomRef.current) socket.emit('rtc:leave', { room: roomRef.current });
    joinedRef.current = false;
  };

  const loadSession = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/sessions/${id}`);
      const { session: s } = res.data.data;
      if (s.format !== 'online') {
        setError('This is an in-person session — no video call available.');
        return;
      }
      setSession(s);
      roomRef.current = s.roomId;
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  // Load the session (and its room id) before wiring up the peer connection.
  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Create peer connection once socket + room are ready.
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      if (!socket || !roomRef.current || pcRef.current) return;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('rtc:signal', { room: roomRef.current, signal: { type: 'ice-candidate', candidate: e.candidate } });
      };
      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setPeerPresent(true);
          setConnecting(false);
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setConnecting(false);
        if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) setConnecting(false);
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (socket.connected) {
          // Join the RTC room and announce presence.
          socket.emit('rtc:join', { room: roomRef.current });
          joinedRef.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not access camera/mic. Allow permissions to join the call.');
          setConnecting(false);
        }
      }
    };

    setup();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, session]);

  useEffect(() => {
    if (!socket || !roomRef.current) return;

    const signal = async ({ from, signal }) => {
      const pc = pcRef.current;
      if (!pc || !signal) return;
      setPeerPresent(true);
      setPeerId(from);
      try {
        if (signal.type === 'offer') {
          const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
          if (offerCollision && !ignoreOfferRef.current) await pc.setLocalDescription({ type: 'rollback' });
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await pc.setLocalDescription(await pc.createAnswer());
          socket.emit('rtc:signal', { room: roomRef.current, signal: { type: 'answer', sdp: pc.localDescription } });
        } else if (signal.type === 'answer') {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          }
        } else if (signal.type === 'ice-candidate') {
          try {
            await pc.addIceCandidate(signal.candidate);
          } catch { /* ignore races */ }
        }
      } catch { /* ignore */ }
    };

    const onPeerJoined = async ({ from }) => {
      const pc = pcRef.current;
      if (!pc || !localStreamRef.current) return;
      setPeerPresent(true);
      setPeerId(from);
      setConnecting(true);
      try {
        makingOfferRef.current = true;
        ignoreOfferRef.current = true;
        await pc.setLocalDescription(await pc.createOffer());
        socket.emit('rtc:signal', { room: roomRef.current, signal: { type: 'offer', sdp: pc.localDescription } });
      } catch { /* ignore */ } finally {
        makingOfferRef.current = false;
      }
    };

    const onPeerLeft = ({ from }) => {
      if (from === peerId) {
        setPeerPresent(false);
        setConnecting(true);
      }
    };

    socket.on('rtc:signal', signal);
    socket.on('rtc:peer-joined', onPeerJoined);
    socket.on('rtc:peer-left', onPeerLeft);
    return () => {
      socket.off('rtc:signal', signal);
      socket.off('rtc:peer-joined', onPeerJoined);
      socket.off('rtc:peer-left', onPeerLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, peerId]);

  useEffect(() => () => { cleanup(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const toggleTrack = (kind) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getTracks().find((t) => t.kind === kind);
    if (!track) return;
    if (kind === 'audio') {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    } else {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const leave = () => {
    cleanup();
    navigate(`/sessions/${id}`);
  };

  if (loading) return <Page><div className="flex h-[60vh] items-center justify-center"><Skeleton className="h-64 w-full max-w-2xl" /></div></Page>;
  if (error) return (
    <Page>
      <div className="mx-auto max-w-md text-center">
        <p className="text-rose-300">{error}</p>
        <Link to={`/sessions/${id}`} className="mt-6 inline-block text-sm font-semibold text-lime hover:underline">Back to session</Link>
      </div>
    </Page>
  );

  return (
    <Page>
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-ivory/60 hover:text-ivory">
            <ArrowLeft size={16} /> {session.title}
          </Link>
          <span className="chip border-lime/40 text-lime">
            {connected ? 'Live ✓' : 'Reconnecting…'}
          </span>
        </div>

        <Card className="relative overflow-hidden bg-midnight-950 p-0">
          <div className="grid min-h-[420px] grid-cols-1 gap-px bg-white/10 sm:grid-cols-2">
            {/* Remote */}
            <div className="relative flex items-center justify-center bg-midnight-900">
              <video ref={remoteVideoRef} autoPlay playsInline muted className="h-full max-h-[420px] w-full object-contain" />
              {!peerPresent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <Avatar size={72} name="Peer" />
                  <p className="font-display text-lg">{connecting ? 'Calling…' : 'Waiting for your partner to join'}</p>
                  <p className="text-sm text-ivory/50">Share the room code below if they are not here.</p>
                  <code className="rounded-lg bg-white/10 px-3 py-1 text-lime">{session.roomId}</code>
                </div>
              ) : (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-[#fff]">
                  {peerId.slice(0, 8)} {connecting ? '· connecting' : ''}
                </div>
              )}
            </div>
            {/* Local */}
            <div className="relative flex items-center justify-center bg-midnight-900">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full max-h-[420px] w-full object-contain" />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-[#fff]">You</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-white/10 p-4">
            <button onClick={() => toggleTrack('audio')} className={`icon-btn ${micOn ? '' : 'text-rose-300'}`} aria-label="Toggle mic">
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={() => toggleTrack('video')} className={`icon-btn ${camOn ? '' : 'text-rose-300'}`} aria-label="Toggle camera">
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <Button variant="danger" className="!px-8" onClick={leave} icon={PhoneOff}>End call</Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}