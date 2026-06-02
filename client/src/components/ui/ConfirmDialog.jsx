import { AlertTriangle, X } from "lucide-react";

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "danger" }) => {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className={`flex items-center gap-3 px-6 py-4 ${isDanger ? "bg-red-50 border-b border-red-100" : "bg-stone-50 border-b border-stone-100"}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle className={`w-5 h-5 ${isDanger ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h2>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
        </div>
        
        <div className="flex gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-stone-300 hover:bg-white text-stone-600 hover:text-stone-800 rounded-xl text-sm font-bold tracking-wide transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-500/25"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/25"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};