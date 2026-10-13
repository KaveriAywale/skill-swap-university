import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  LifeBuoy,
  Video,
  MessageSquare,
  Gift,
  Trophy,
  BadgeCheck,
  BarChart3,
  Settings,
  UserCircle,
  Bell,
  Search,
  Flame,
  LogOut,
  Menu,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';
import Brand from '../Brand';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar, Button } from '../ui';
import { timeAgo } from '../../lib/utils';
import api from '../../lib/api';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover skills', icon: Compass },
  { to: '/requests', label: 'Help requests', icon: LifeBuoy },
  { to: '/sessions', label: 'Sessions', icon: Video },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/offers', label: 'My offers', icon: Gift },
  { to: '/leaderboard', label: 'Karma & badges', icon: Trophy },
  { to: '/verification', label: 'Skill check', icon: BadgeCheck },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
];

function NotificationBell() {
  const { notifications, markNotificationRead } = useSocket();
  const [open, setOpen] = useState(false);
  const [apiNotifications, setApiNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const merged = [...notifications, ...apiNotifications.filter((n) => !notifications.some((x) => x._id === n._id))].filter(
    (n, i, arr) => arr.findIndex((x) => x._id === n._id) === i
  );

  useEffect(() => {
    api
      .get('/notifications?limit=12')
      .then((res) => {
        setApiNotifications(res.data.data);
        setUnread(res.data.meta.unreadCount);
      })
      .catch(() => {});
  }, [notifications.length]);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const clearAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnread(0);
      setApiNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-ivory/80 transition hover:bg-white/10"
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-midnight-950">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card absolute right-0 top-12 z-[120] w-[340px] max-w-[90vw] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button onClick={clearAll} className="text-xs text-lavender hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {merged.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ivory/40">Nothing yet. Keep an eye out!</p>
            ) : (
              merged.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) {
                      markNotificationRead(n._id);
                      api.post(`/notifications/${n._id}/read`).catch(() => {});
                    }
                    setOpen(false);
                    if (n.link) window.location.assign(n.link);
                  }}
                  className={`flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                    n.read ? 'opacity-55' : ''
                  }`}
                >
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-lime" />
                  <span>
                    <span className="block text-sm font-medium leading-snug">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-ivory/50">{n.body}</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-ivory/35">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function KarmaChip() {
  const { user } = useAuth();
  return (
    <Link
      to="/leaderboard"
      className="flex items-center gap-1.5 rounded-xl border border-lime/25 bg-lime/10 px-3 py-2 text-sm font-bold text-lime transition hover:bg-lime/15"
      title="Karma balance"
    >
      <Flame size={16} />
      {user?.karma ?? 0}
    </Link>
  );
}

function SearchBox({ mobile = false }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : '/discover');
      }}
      className={`relative ${mobile ? 'w-full' : 'hidden w-64 md:block'}`}
    >
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search skills or students…"
        className="input-field !py-2 pl-9"
        aria-label="Search skills and students"
      />
    </form>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 transition hover:bg-white/10"
      >
        <Avatar src={user?.avatar} name={user?.name} size={30} />
        <span className="hidden max-w-[110px] truncate text-sm font-medium sm:block">{user?.name?.split(' ')[0]}</span>
      </button>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card absolute right-0 top-12 z-[120] w-56 overflow-hidden p-1.5"
        >
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ivory/80 hover:bg-white/5"
          >
            <UserCircle size={16} /> My profile
          </Link>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ivory/80 hover:bg-white/5"
          >
            <Settings size={16} /> Settings & privacy
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose/10"
          >
            <LogOut size={16} /> Sign out
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-midnight-900/80 px-4 py-5 backdrop-blur-xl lg:flex">
      <Brand to="/dashboard" />
      <nav className="mt-8 flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-lime/20 to-lavender/10 font-semibold text-lime shadow-soft'
                  : 'text-ivory/65 hover:bg-white/5 hover:text-ivory'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-lime to-lavender transition-all ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  }`}
                />
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Link to="/settings" className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
        <Avatar src={user?.avatar} name={user?.name} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user?.name}</span>
          <span className="block text-xs text-ivory/45">
            {user?.department} · Yr {user?.year}
          </span>
        </span>
      </Link>
      {user?.isDemo ? (
        <p className="rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 text-[11px] text-accent-amber">
          Demo account — data is sample content
        </p>
      ) : null}
    </aside>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const main = NAV.slice(0, 4);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-midnight-950/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Brand to="/dashboard" />
        <div className="flex items-center gap-2">
          <KarmaChip />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className="!px-2"
          >
            <Menu size={20} />
          </Button>
        </div>
      </header>

      {open ? (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="fixed inset-0 z-[160] flex bg-midnight-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex h-full w-[300px] flex-col gap-1 overflow-y-auto border-l border-white/10 bg-midnight-900 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <Brand to="/dashboard" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-ivory/60 hover:text-ivory">
                <X size={20} />
              </button>
            </div>
            <SearchBox mobile />
            <div className="mt-2 space-y-0.5">
              {NAV.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    setOpen(false);
                    navigate(to);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ivory/75 transition hover:bg-white/5 hover:text-ivory"
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ivory/75 hover:bg-white/5"
              >
                <UserCircle size={18} /> My profile
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      <nav className="sticky bottom-0 z-40 flex justify-around border-t border-white/10 bg-midnight-900/95 px-2 py-1.5 backdrop-blur-md lg:hidden">
        {main.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition ${
                isActive ? 'text-lime' : 'text-ivory/50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition ${
              isActive ? 'text-lime' : 'text-ivory/50'
            }`
          }
        >
          <Video size={18} />
          Sessions
        </NavLink>
      </nav>

      {user?.isDemo ? (
        <div className="fixed bottom-[76px] left-3 z-40 lg:hidden">
          <span className="chip border-accent-amber/30 bg-accent-amber/10 text-accent-amber">Demo data</span>
        </div>
      ) : null}
    </>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="hidden items-center gap-2 xl:flex">
      <Button variant="secondary" size="sm" icon={LifeBuoy} onClick={() => navigate('/requests/new')}>
        Request help
      </Button>
      <Button size="sm" icon={Plus} onClick={() => navigate('/offers/new')}>
        Offer skill
      </Button>
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="relative min-h-screen bg-midnight-950">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.5]" />
        <div className="absolute -top-40 right-0 h-[460px] w-[460px] rounded-full bg-accent-violet/15 blur-[150px] animate-float" />
        <div className="absolute bottom-0 left-40 h-[360px] w-[360px] rounded-full bg-lime/10 blur-[140px] animate-float [animation-delay:-2s]" />
        <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-lavender/10 blur-[130px] animate-float [animation-delay:-4s]" />
      </div>
      <Sidebar />
      <MobileNav />

      <div className="relative lg:pl-60">
        <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-white/10 bg-midnight-950/85 px-6 py-3 backdrop-blur-md lg:flex">
          <SearchBox />
          <div className="flex items-center gap-2.5">
            <QuickActions />
            <NotificationBell />
            <KarmaChip />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}