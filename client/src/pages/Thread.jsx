import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Skeleton } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export default function Thread() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, connected, reconnecting } = useSocket();
  const { showError } = useToast();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [conv, msgs] = await Promise.all([
        api.get(`/conversations`),
        api.get(`/conversations/${id}/messages?limit=100`),
      ]);
      const found = conv.data.data.find((c) => c.id === id);
      setConversation(found || { id });
      setMessages(msgs.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('conversation:join', { conversationId: id });
    socket.on('message:new', (msg) => {
      if (msg.conversation?.toString() === id || msg.conversation === id) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    });
    return () => {
      socket.off('message:new');
      socket.emit('conversation:leave', { conversationId: id });
    };
  }, [socket, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      if (socket?.connected) {
        const res = await new Promise((resolve) =>
          socket.emit('message:send', { conversationId: id, body: body.trim() }, resolve)
        );
        if (!res?.ok) throw new Error(res?.error || 'Failed to send');
        setBody('');
      } else {
        await api.post(`/conversations/${id}/messages`, { body: body.trim() });
        setBody('');
        load();
      }
    } catch (err) {
      showError(extractError(err, 'Could not send message'));
    } finally {
      setSending(false);
    }
  };

  const markRead = async () => {
    try {
      await api.post(`/conversations/${id}/read`);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    if (conversation?.id) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, messages.length]);

  const other = conversation?.other;

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/messages" className="flex items-center gap-1.5 text-sm text-ivory/60 hover:text-ivory">
            <ArrowLeft size={16} /> Back to inbox
          </Link>
          <div className="flex items-center gap-2">
            {!connected ? (
              <span className="chip border-amber/40 text-accent-amber">
                <WifiOff size={12} /> {reconnecting ? 'Reconnecting…' : 'Offline — messages queue'}
              </span>
            ) : (
              <span className="chip border-lime/40 text-lime">
                <Wifi size={12} /> Live
              </span>
            )}
          </div>
        </div>

        <Card className="flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            {conversation?.other ? (
              <div className="flex items-center gap-3">
                <Avatar src={other.avatar} name={other.name} size={40} />
                <div>
                  <p className="font-semibold">{other.name}</p>
                  <p className="text-xs text-ivory/45">{other.department} · Yr {other.year}</p>
                </div>
              </div>
            ) : (
              <p className="font-semibold">Conversation</p>
            )}
            {other?._id ? (
              <Link to={`/profile/${other._id}`} className="text-xs font-semibold text-lime hover:underline">
                View profile
              </Link>
            ) : null}
          </div>

          {/* Messages */}
          <div className="max-h-[460px] min-h-[320px] flex-1 space-y-3 overflow-y-auto bg-midnight-900/40 p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-10 w-1/2 self-end" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ) : error ? (
              <p className="py-10 text-center text-sm text-rose-300">{error}</p>
            ) : messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-ivory/45">
                Say hi and agree on a time for your session.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender?._id === user?._id;
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                        mine
                          ? 'rounded-br-md bg-lime/90 text-midnight-950'
                          : 'rounded-bl-md border border-white/10 bg-white/5 text-ivory'
                      }`}
                    >
                      {m.type === 'system' ? (
                        <span className="text-xs italic opacity-70">{m.body}</span>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-midnight-900/60' : 'text-ivory/35'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message…"
              className="input-field"
              aria-label="Message"
            />
            <Button type="submit" loading={sending} disabled={!body.trim()} icon={Send} className="!px-3">
              Send
            </Button>
          </form>
        </Card>
      </div>
    </Page>
  );
}