import { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SettingsPanel } from '@/components/SettingsPanel';
import { SlideOutMenu } from '@/components/SlideOutMenu';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="halo-shell">
      <div className="halo-gradient" aria-hidden />
      <div className="halo-noise" aria-hidden />
      <SlideOutMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="halo-top-bar">
        <button
          type="button"
          className="menu-trigger"
          onClick={() => setMenuOpen(true)}
        >
          <span className="menu-symbol" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span>Menu</span>
        </button>
        <div className="halo-topline">
          <p className="eyebrow">AI-Driven Legal Discovery</p>
          <h1>Neuro-SAN Litigation OS</h1>
        </div>
        <div className="halo-case-meta">
          <span>Case Hub</span>
          <strong>Smith v. Smith</strong>
        </div>
      </header>

      <main className="halo-stage cinematic-main">{children}</main>

      <footer className="halo-bottom-bar">
        <div className="halo-links">
          <button type="button">Contact Us</button>
          <button type="button">Diagnostics</button>
          <button type="button">System Logs</button>
        </div>
      </footer>

      <div className="halo-settings">
        <SettingsPanel triggerVariant="icon" triggerLabel="Open settings" />
      </div>

      <OfflineIndicator />
    </div>
  );
}