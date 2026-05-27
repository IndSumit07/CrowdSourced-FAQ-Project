import { Outlet, Link, useLocation } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import { useAuthStore } from "../../store/authStore";
import { useSocketEvents } from "../../hooks/useSocketEvents";

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Wire up socket events globally for authenticated users
  useSocketEvents();

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", roles: ["user", "admin"] },
    {
      name: "My Contributions",
      path: "/contributions",
      roles: ["user", "admin"],
    },
    { name: "Ask Query", path: "/ask", roles: ["user", "admin", "guest"] },
    { name: "Live Feed", path: "/feed", roles: ["user", "admin", "guest"] },
    { name: "FAQs", path: "/faqs", roles: ["user", "admin", "guest"] },
    { name: "Profile", path: "/profile", roles: ["user", "admin"] },
  ];

  const allowedLinks = navLinks.filter((link) =>
    link.roles.includes(user?.role || "guest"),
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans">
      <SiteHeader />

      <div className="pt-28 pb-12 px-4 md:px-8">
        <div className="relative">
          {/* Sidebar */}
          <aside className="w-full md:fixed md:left-6 md:top-28 md:w-64 md:h-[calc(100vh-8rem)] md:overflow-y-auto flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className="mb-6 pb-6 border-b border-stone-100">
                {user ? (
                  <>
                    <h2 className="text-lg font-bold text-stone-900">
                      {user.name}
                    </h2>
                    <p className="text-sm text-stone-500 capitalize">
                      {user.role}
                    </p>
                    {user.role !== "admin" && (
                      <div className="mt-2 text-xs font-medium text-[#B45309] bg-[#B45309]/10 py-1 px-2 rounded-md inline-block">
                        Reputation: {user.reputation || 0}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-stone-900">
                      Guest Session
                    </h2>
                    <p className="text-sm text-stone-400">
                      Anonymous Viewer
                    </p>
                    <Link
                      to="/login"
                      className="mt-3 block text-center text-xs font-extrabold uppercase tracking-wider text-white bg-[#B45309] hover:bg-stone-900 py-2 px-3 rounded-xl transition-all shadow-sm hover:shadow"
                    >
                      Sign In to Participate
                    </Link>
                  </>
                )}
              </div>

              <nav className="flex flex-col gap-2">
                {allowedLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      location.pathname === link.path
                        ? "bg-[#0D9488]/10 text-[#0D9488]"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="md:ml-72 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8 min-h-[600px]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
