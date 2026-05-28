import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const SiteHeader = () => {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-6xl bg-white/95 backdrop-blur-md border border-stone-200 rounded-full px-5 py-3 md:px-8 md:py-3.5 shadow-sm transition-all duration-300 hover:shadow-md font-home">
        {/* Left Logo Icon */}
        <Link
          to="/"
          className="flex items-center gap-3 cursor-pointer select-none"
          title="QueryCare Home"
        >
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
            <svg
              className="w-5 h-5 text-white"
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
          {/* Center Stylized Brand Name */}
          <span className="text-lg md:text-xl font-semibold tracking-tight select-none font-home">
            <span className="text-stone-900">Query</span>
            <span className="text-[#0D9488]">Care</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-500">
          <a href="#home" className="hover:text-stone-900 transition-colors">
            Home
          </a>
          <a href="#values" className="hover:text-stone-900 transition-colors">
            Values
          </a>
          <Link to="/faqs" className="hover:text-stone-900 transition-colors">
            FAQs
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-stone-600 hover:text-stone-900 tracking-wide transition-colors select-none"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-stone-600 hover:text-stone-900 tracking-wide transition-colors select-none"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default SiteHeader;
