import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-4">
    {/* Background glow */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
    </div>

    <div className="relative w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg glow-blue">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white font-display">FAQ Platform</span>
        </Link>
        {title && <h1 className="mt-6 text-2xl font-bold text-white font-display">{title}</h1>}
        {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8">
        {children}
      </div>
    </div>
  </div>
);
