import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const SiteHeader = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-4xl bg-[#FAF6F0]/85 backdrop-blur-md border border-stone-200/60 rounded-full px-5 py-2 md:px-6 md:py-2.5 shadow-soft transition-all duration-300 hover:shadow-strong">
        
        {/* Left Logo Icon */}
        <Link to="/" className="flex items-center cursor-pointer select-none" title="QueryCare Home">
          <div className="w-9 h-9 rounded-full bg-[#B45309] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105">
            <svg className="w-5 h-5 text-[#FAF6F0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.018Z" />
            </svg>
          </div>
        </Link>

        {/* Center Stylized Brand Name */}
        <div className="flex items-center">
          <span className="text-xl md:text-2xl font-serif-display font-black tracking-tight select-none">
            <span className="text-stone-900">Query</span>
            <span className="text-[#B45309]">Care</span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3.5 md:gap-5">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-[10px] md:text-xs font-extrabold text-stone-600 hover:text-[#B45309] tracking-wider uppercase transition-colors select-none">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-1.5 md:px-5 md:py-2 bg-stone-900 hover:bg-[#B45309] text-[#FAF6F0] rounded-full text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm hover:shadow">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-[10px] md:text-xs font-extrabold text-stone-600 hover:text-[#B45309] tracking-wider uppercase transition-colors select-none">
                Dashboard
              </Link>
              <button onClick={logout} className="px-4 py-1.5 md:px-5 md:py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-full text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm">
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
