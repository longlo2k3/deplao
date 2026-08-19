/**
 * DownloadDropdown - Nút tải xuống dạng dropdown dùng chung.
 * Dropdown dùng position:fixed để không bị clip bởi overflow:hidden của parent.
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DOWNLOAD_URL, DOWNLOAD_URL_MAC_ARM64, DOWNLOAD_URL_MAC_X64, DOWNLOAD_URL_LINUX } from '../constants';

interface DownloadDropdownProps {
  /** Text hiển thị trên nút */
  label?: string;
  /** Kiểu nút */
  variant?: 'primary' | 'secondary' | 'featured' | 'outlined';
  /** Full width (dùng trong Pricing card) */
  block?: boolean;
  /** Dropdown mở lên trên thay vì xuống dưới */
  dropUp?: boolean;
  /** Căn dropdown */
  align?: 'left' | 'center' | 'right';
  /** Extra className cho nút trigger */
  className?: string;
  /** Extra className cho wrapper */
  wrapperClassName?: string;
}

const MENU_WIDTH = 240; // px - w-60

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({
  label = 'Tải xuống',
  variant = 'primary',
  block = false,
  dropUp = false,
  align = 'center',
  className = '',
  wrapperClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Tính toán vị trí fixed khi mở */
  const handleToggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let left =
        align === 'left'  ? rect.left :
        align === 'right' ? rect.right - MENU_WIDTH :
        rect.left + rect.width / 2 - MENU_WIDTH / 2;

      // Clamp vào viewport (tránh tràn ra ngoài màn hình)
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

      const style: React.CSSProperties = {
        position: 'fixed',
        left,
        width: MENU_WIDTH,
        zIndex: 9999,
      };
      if (dropUp) {
        style.bottom = window.innerHeight - rect.top + 6;
      } else {
        style.top = rect.bottom + 6;
      }
      setMenuStyle(style);
    }
    setOpen(true);
  };

  /* Click ngoài → đóng */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Scroll/resize → đóng để tránh lệch vị trí */
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  /* ── Styles ── */
  const triggerBase =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer border-none outline-none';

  const variantClass: Record<string, string> = {
    primary:  'btn-primary text-white',
    secondary: 'btn-secondary',
    featured:
      'px-6 py-3 rounded-2xl text-sm text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5',
    outlined:
      'px-6 py-3 rounded-2xl text-sm text-slate-700 border border-slate-200 bg-white/80 hover:bg-white hover:border-indigo-200 shadow-[0_10px_30px_rgba(148,163,184,0.12)]',
  };

  return (
    <div className={`relative ${block ? 'block' : 'inline-block'} ${wrapperClassName}`.trim()}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`${triggerBase} ${variantClass[variant]} ${block ? 'w-full' : ''} ${className}`}
      >
        {/* Download icon */}
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{label}</span>
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown - render vào document.body qua Portal
          → thoát hoàn toàn khỏi mọi ancestor có transform/overflow:hidden */}
      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuStyle.top,
            bottom: menuStyle.bottom,
            left: menuStyle.left,
            width: MENU_WIDTH,
            zIndex: 9999,
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '18px',
            border: '1px solid rgba(148,163,184,0.18)',
            boxShadow: '0 30px 80px rgba(76,98,148,0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          {/* Windows */}
          <a
            href={DOWNLOAD_URL}
            download
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-800 no-underline"
            style={{ transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.95)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-xl">🪟</span>
            <div>
              <div className="font-semibold">Windows 10/11</div>
              <div className="text-xs text-slate-500">.exe · 64-bit</div>
            </div>
          </a>

          <div style={{ borderTop: '1px solid rgba(148,163,184,0.14)' }} />

          {/* macOS Apple Silicon */}
          <a
            href={DOWNLOAD_URL_MAC_ARM64}
            download
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-800 no-underline"
            style={{ transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.95)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-xl">🍎</span>
            <div>
              <div className="font-semibold">macOS Apple</div>
              <div className="text-xs text-slate-500">chip M series</div>
            </div>
          </a>

          {/* macOS Intel */}
          <a
            href={DOWNLOAD_URL_MAC_X64}
            download
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-800 no-underline"
            style={{ transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.95)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-xl">💻</span>
            <div>
              <div className="font-semibold">macOS Intel</div>
              <div className="text-xs text-slate-500">chip Intel series</div>
            </div>
          </a>

          <div style={{ borderTop: '1px solid rgba(148,163,184,0.14)' }} />

          {/* Linux */}
          <a
            href={DOWNLOAD_URL_LINUX}
            download
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-800 no-underline"
            style={{ transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.95)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-xl">🐧</span>
            <div>
              <div className="font-semibold">Ubuntu Linux</div>
              <div className="text-xs text-slate-500">.AppImage · mọi distro</div>
            </div>
          </a>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DownloadDropdown;

