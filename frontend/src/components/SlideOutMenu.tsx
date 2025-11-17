import { useEffect } from 'react';
import type { JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface SlideOutMenuProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard', description: 'Halo mission control' },
  { label: 'Upload Evidence', path: '/upload', description: 'Evidence ingestion pipeline' },
  { label: 'Graph Explorer', path: '/graph', description: 'Vector + relationship graph' },
  { label: 'Live Co-Counsel Chat', path: '/live-chat', description: 'Multi-agent huddle' },
  { label: 'Timeline Builder', path: '/timeline', description: 'Chronology editor' },
  { label: 'Mock Trial Arena', path: '/mock-trial', description: 'Adversarial simulations' },
  { label: 'Trial University', path: '/trial-university', description: 'Training sequences' },
  { label: 'Legal Theory Lab', path: '/legal-theory', description: 'Strategy drafting' },
  { label: 'Document Drafting', path: '/drafting', description: 'Brief + motion studio' },
  { label: 'Design System', path: '/design-system', description: 'Cinematic primitives' },
];

export function SlideOutMenu({ open, onClose }: SlideOutMenuProps): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    onClose();
  }, [location.pathname, onClose, open]);

  return (
    <>
      <div
        className={cn('slideout-overlay', open && 'open')}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={cn('slideout-panel', open && 'open')}
        aria-hidden={!open}
        aria-live="polite"
      >
        <div className="slideout-header">
          <p className="eyebrow">Mission Control</p>
          <h2>Neuro-SAN Litigation OS</h2>
          <button type="button" className="slideout-close" onClick={onClose}>
            <span>Close</span>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <nav className="slideout-nav" aria-label="Primary navigation">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={cn(
                    'slideout-link',
                    location.pathname === link.path && 'active'
                  )}
                >
                  <div>
                    <span>{link.label}</span>
                    <small>{link.description}</small>
                  </div>
                  <i className="fa-solid fa-chevron-right" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="slideout-footer">
          <ThemeToggle />
          <p>v2.1 • Secure enclave ready</p>
        </div>
      </aside>
    </>
  );
}

