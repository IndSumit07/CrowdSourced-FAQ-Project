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
    <div className="min-h-screen bg-stone-50 flex">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-stone-200 bg-white fixed h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#0F766E] shadow-sm flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-[15px] font-display tracking-tight leading-tight">QueryCare</p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">AI-Powered</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-stone-100 p-4 space-y-1.5">
          {/* Socket status */}
          <div className="flex items-center gap-2 px-3.5 py-2">
            {socketConnected
              ? <Wifi className="w-3.5 h-3.5 text-teal-600" />
              : <WifiOff className="w-3.5 h-3.5 text-stone-400" />}
            <span className={`text-xs font-semibold ${socketConnected ? 'text-teal-600' : 'text-stone-400'}`}>
              {socketConnected ? 'Live Connection' : 'Offline Mode'}
            </span>
          </div>

          <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Bell className="w-4.5 h-4.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto bg-teal-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User className="w-4.5 h-4.5" />
            Profile
          </NavLink>

          <button onClick={handleLogout} className="nav-link w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4.5 h-4.5" />
            Logout
          </button>
        </div>

        {/* User info */}
        <div className="px-4 pb-6 mt-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-sm font-bold text-teal-700 shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{user?.name}</p>
              <p className="text-[11px] font-semibold text-stone-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen relative">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
};
