import { Search, X } from 'lucide-react';
import { useState } from 'react';

export const SearchBar = ({ placeholder = 'Search...', onSearch, defaultValue = '', className = '' }) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch?.('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 text-slate-500 w-4 h-4 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-10 text-slate-500 hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
      >
        Go
      </button>
    </form>
  );
};

export const Select = ({ value, onChange, options, className = '', placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`input-field cursor-pointer ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-[#111827]">
        {opt.label}
      </option>
    ))}
  </select>
);

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-slate-400 text-sm px-3">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
};
