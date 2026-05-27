import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, MessageSquare, Zap, Users,
  ShieldCheck, Bell, LogOut, User, ChevronDown, Wifi, WifiOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { getSocket } from '@/lib/socket';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const navItems = {
  user: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faqs', icon: Search, label: 'Browse FAQs' },
    { to: '/ask', icon: MessageSquare, label: 'Ask Question' },
  ],
  contributor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faqs', icon: Search, label: 'Browse FAQs' },
    { to: '/ask', icon: MessageSquare, label: 'Ask Question' },
    { to: '/feed', icon: Zap, label: 'Live Feed' },
    { to: '/contributor', icon: Users, label: 'My Contributions' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faqs', icon: Search, label: 'Browse FAQs' },
    { to: '/ask', icon: MessageSquare, label: 'Ask Question' },
    { to: '/feed', icon: Zap, label: 'Live Feed' },
    { to: '/contributor', icon: Users, label: 'My Contributions' },
    { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
  ],
};

export const AppLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const [socketConnected, setSocketConnected] = useState(false);

  // Wire all socket events globally
  useSocketEvents();

  useEffect(() => {
    const checkSocket = () => {
      const s = getSocket();
      setSocketConnected(s?.connected ?? false);
    };
    checkSocket();
    const interval = setInterval(checkSocket, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const items = navItems[user?.role] || navItems.user;

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/8 bg-[#0d1117] fixed h-full z-30">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm font-display">FAQ Platform</p>
              <p className="text-xs text-slate-500">AI-Powered</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/8 p-3 space-y-1">
          {/* Socket status */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            {socketConnected
              ? <Wifi className="w-3 h-3 text-emerald-400" />
              : <WifiOff className="w-3 h-3 text-slate-500" />}
            <span className={`text-xs ${socketConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {socketConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User className="w-4 h-4" />
            Profile
          </NavLink>

          <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* User info */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/8">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────── */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};
