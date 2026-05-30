import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { getSocket } from "../../lib/socket";
import {
  Home,
  MessageSquare,
  HelpCircle,
  Radio,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useSocketEvents();

  useEffect(() => {
    const checkSocket = () => {
      const socket = getSocket();
      setSocketConnected(socket?.connected ?? false);
    };

    checkSocket();
    const interval = setInterval(checkSocket, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
      roles: ["user", "admin"],
    },
    {
      name: "My Contributions",
      path: "/contributions",
      icon: MessageSquare,
      roles: ["user", "admin"],
    },
    {
      name: "Ask Query",
      path: "/ask",
      icon: HelpCircle,
      roles: ["user", "guest"],
    },
    {
      name: "Live Feed",
      path: "/feed",
      icon: Radio,
      roles: ["user", "admin", "guest"],
    },
    {
      name: "FAQs",
      path: "/faqs",
      icon: BookOpen,
      roles: ["user", "admin", "guest"],
    },
    { name: "Profile", path: "/profile", icon: User, roles: ["user", "admin"] },
  ];

  const allowedLinks = navLinks.filter((link) =>
    link.roles.includes(user?.role || "guest"),
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 font-dashboard text-slate-900">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/70 z-50">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 md:hidden"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-sm">
              <svg
                className="w-4.5 h-4.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018Z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-slate-900">Query</span>
              <span className="text-teal-600">Care</span>
            </span>
          </div>

          <div className="hidden lg:flex flex-1 justify-center">
            {socketConnected && (
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Live connection
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100">
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200/70 overflow-y-auto z-50 transform transition-transform duration-200 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          {user && (
            <div className="mb-5 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {user.name}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              {user.role !== "admin" && (
                <div className="text-xs font-medium text-slate-500">
                  {user.reputation || 0} rep
                </div>
              )}
            </div>
          )}

          <nav className="flex-1 flex flex-col gap-1">
            {allowedLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`sidebar-link ${isActive(link.path) ? "active" : ""}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {link.name}
                  {isActive(link.path) && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className="mt-auto pt-5 border-t border-slate-100">
              <Link to="/login" className="btn-primary w-full justify-center">
                Sign In to Participate
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 min-h-screen md:ml-64">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
