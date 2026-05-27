import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={`animate-spin text-blue-400 ${sizes[size]} ${className}`} />;
};

export const FullPageSpinner = () => (
  <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-3 text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);
