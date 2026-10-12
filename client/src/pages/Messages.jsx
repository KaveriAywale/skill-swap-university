import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';
import Page from '../components/Page';
import { Avatar, Button, Card, Skeleton, EmptyState } from '../components/ui';
import api, { extractError } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../lib/utils';

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/conversations');
      setData(res.data.data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onMessage = () => load();
    socket.on('conversation:updated', onMessage);
    socket.on('message:new', onMessage);
    return () => {
      socket.off('conversation:updated', onMessage);
      socket.off('message:new', onMessage);
    };
  }, [socket]);

  return (
    <Page
      title="Messages"
      subtitle="Private conversations with your matched peers."
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate('/requests')}>
          Start from a request
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-5 text-rose-300">{error}</Card>
      ) : data.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Message a recommended helper from a request, or have someone message you first."
          action={<Button size="sm" onClick={() => navigate('/requests')}>Discover requests</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {data.map((c) => {
            const isHelperView = c.other?._id === user?._id;
            return (
              <Link key={c.id} to={`/messages/${c.id}`} className="block">
                <Card hover className={`flex items-center gap-3.5 p-4 ${c.unread ? 'border-lime/30' : ''}`}>
                  <div className="relative">
                    <Avatar src={c.other?.avatar} name={c.other?.name} size={46} />
                    {c.unread ? (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-midnight-800 bg-lime" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">
                        {c.other?.name || 'Peer'}
                        {isHelperView ? ' (helper)' : ''}
                      </p>
                      <span className="shrink-0 text-[11px] text-ivory/40">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className={`truncate text-sm ${c.unread ? 'font-medium text-ivory' : 'text-ivory/50'}`}>
                      {c.lastMessage || 'Say hello…'}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-ivory/30" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}