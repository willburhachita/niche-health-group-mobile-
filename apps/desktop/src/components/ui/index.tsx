import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, X } from 'lucide-react';

export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

// ── Button ──────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-navy text-white hover:bg-navy-dark focus:ring-navy/40',
    secondary: 'bg-navy-50 text-navy hover:bg-navy-100 focus:ring-navy/20',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          className={cn(
            'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:bg-gray-50 disabled:text-gray-500',
            !!icon && 'pl-9',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── PhoneInput ────────────────────────────────────────────────────
// Phone number entry with a country-code dropdown. Defaults to Zambia (+260).
// `value` is the local number only; `countryCode` is e.g. "+260".
export const COUNTRY_CODES: { code: string; label: string; flag: string }[] = [
  { code: '+260', label: 'Zambia', flag: '🇿🇲' },
  { code: '+27', label: 'South Africa', flag: '🇿🇦' },
  { code: '+263', label: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+265', label: 'Malawi', flag: '🇲🇼' },
  { code: '+254', label: 'Kenya', flag: '🇰🇪' },
  { code: '+255', label: 'Tanzania', flag: '🇹🇿' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', label: 'United States', flag: '🇺🇸' },
];

interface PhoneInputProps {
  label?: string;
  error?: string;
  countryCode?: string;
  value: string;
  onChangeCountry: (code: string) => void;
  onChangeNumber: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PhoneInput({
  label,
  error,
  countryCode = '+260',
  value,
  onChangeCountry,
  onChangeNumber,
  placeholder = '977 123 456',
  disabled,
}: PhoneInputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className={cn(
        'flex w-full rounded-lg border border-gray-200 bg-white transition focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20',
        error && 'border-red-400',
        disabled && 'bg-gray-50'
      )}>
        <select
          value={countryCode}
          onChange={(e) => onChangeCountry(e.target.value)}
          disabled={disabled}
          className="rounded-l-lg border-r border-gray-200 bg-transparent px-2 py-2 text-sm text-gray-700 focus:outline-none"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChangeNumber(e.target.value.replace(/[^0-9 ]/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:text-gray-500"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Helpers to split / join a stored phone string ("+260977123456")
export function splitPhone(stored: string | undefined | null, defaultCode = '+260'): { code: string; number: string } {
  if (!stored) return { code: defaultCode, number: '' };
  const match = COUNTRY_CODES.find((c) => stored.startsWith(c.code));
  if (match) return { code: match.code, number: stored.slice(match.code.length).trim() };
  return { code: defaultCode, number: stored };
}

export function joinPhone(code: string, number: string): string {
  const trimmed = number.replace(/\s+/g, '');
  if (!trimmed) return '';
  return `${code}${trimmed.startsWith('0') ? trimmed.slice(1) : trimmed}`;
}

// ── Textarea ─────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={cn('w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none', error && 'border-red-400', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={cn('w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
interface BadgeProps { label: string; color?: 'navy' | 'peach' | 'green' | 'red' | 'amber' | 'gray' | 'blue'; }

export function Badge({ label, color = 'gray' }: BadgeProps) {
  const colors = {
    navy: 'bg-navy-50 text-navy', peach: 'bg-peach-light text-peach-dark',
    green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700', gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-700',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color])}>{label}</span>;
}

// ── Avatar ─────────────────────────────────────────────────────────
interface AvatarProps { name: string; size?: 'sm' | 'md' | 'lg'; color?: string; }

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' };
  const bg = color || 'bg-navy';
  return (
    <div className={cn('flex items-center justify-center rounded-full font-semibold text-white shrink-0', sizes[size], bg)}>
      {initials}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; }

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={cn('bg-white border border-gray-100 rounded-xl shadow-card', onClick && 'cursor-pointer hover:border-navy/20 transition-colors', className)}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; color?: string; sub?: string; onClick?: () => void; }

export function StatCard({ label, value, icon, color = 'text-navy', sub, onClick }: StatCardProps) {
  return (
    <Card className="p-5" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">{icon}</div>
      </div>
    </Card>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-navy" />;
}

// ── EmptyState ────────────────────────────────────────────────────
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; width?: string; }

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-modal w-full flex flex-col max-h-[90vh]', width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  );
}
