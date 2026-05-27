import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const styles = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
};

export const Alert = ({ type = 'info', message, onClose }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[type]} animate-fade-in`}>
    <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
    <p className="text-sm text-slate-300 flex-1">{message}</p>
    {onClose && (
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16 px-4">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-300">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Badge = ({ children, variant = 'slate' }) => (
  <span className={`badge-${variant}`}>{children}</span>
);

export const StatusBadge = ({ status }) => {
  const map = {
    open: 'blue',
    'in-progress': 'yellow',
    completed: 'green',
    expired: 'slate',
    rejected: 'red',
    processing: 'purple',
    pending: 'yellow',
    published: 'green',
  };
  return <span className={`badge-${map[status] || 'slate'}`}>{status}</span>;
};

export const CategoryBadge = ({ category }) => {
  const map = {
    internship: 'blue',
    placement: 'green',
    resume: 'purple',
    dsa: 'yellow',
    'coding-interview': 'red',
    career: 'slate',
    general: 'slate',
  };
  return <span className={`badge-${map[category] || 'slate'}`}>{category}</span>;
};

export const RoleBadge = ({ role }) => {
  const map = { admin: 'red', contributor: 'blue', user: 'slate' };
  return <span className={`badge-${map[role] || 'slate'}`}>{role}</span>;
};
