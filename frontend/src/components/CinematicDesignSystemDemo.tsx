import { useState } from 'react';

export function CinematicDesignSystemDemo() {
  const [isGlowing, setIsGlowing] = useState(false);
  const [progress, setProgress] = useState(65);

  return (
    <div className="cds-app-cinematic">
      <div className="cds-bg-parallax" aria-hidden="true" />
      
      <header className="cds-header-cinematic">
        <div>
          <h1 className="text-text-primary font-display text-4xl">Cinematic Design System</h1>
          <p className="text-text-secondary mt-2">Showcasing premium dark-mode UI components</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="cds-btn-accent"
            onMouseEnter={() => setIsGlowing(true)}
            onMouseLeave={() => setIsGlowing(false)}
          >
            Interactive Button
          </button>
        </div>
      </header>

      <div className="cds-body-cinematic">
        <nav className="cds-nav-cinematic">
          <ul className="flex flex-col gap-2">
            <li>
              <button className="w-full text-left p-3 bg-background-surface rounded-lg text-text-primary border border-border-default hover:bg-background-panel transition-medium">
                Dashboard
              </button>
            </li>
            <li>
              <button className="w-full text-left p-3 bg-background-surface rounded-lg text-text-primary border border-border-default hover:bg-background-panel transition-medium">
                Evidence
              </button>
            </li>
            <li>
              <button className="w-full text-left p-3 bg-background-surface rounded-lg text-text-primary border border-border-default hover:bg-background-panel transition-medium">
                Graph Explorer
              </button>
            </li>
          </ul>
        </nav>

        <main className="cds-main-cinematic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Color Palette Showcase */}
            <div className="cds-card-cinematic p-6">
              <h2 className="text-text-primary font-display text-2xl mb-4">Color Palette</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-text-secondary">Backgrounds</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-background-canvas"></div>
                      <span className="text-sm text-text-secondary">#101217</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-background-surface"></div>
                      <span className="text-sm text-text-secondary">#181a1e</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-background-panel"></div>
                      <span className="text-sm text-text-secondary">#22232a</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-text-secondary">Accents</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-accent-cyan-500"></div>
                      <span className="text-sm text-text-secondary">Cyan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-accent-violet-500"></div>
                      <span className="text-sm text-text-secondary">Violet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-accent-gold"></div>
                      <span className="text-sm text-text-secondary">Gold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Showcase */}
            <div className="cds-card-cinematic p-6">
              <h2 className="text-text-primary font-display text-2xl mb-4">Typography</h2>
              
              <div className="flex flex-col gap-3">
                <h1 className="font-display text-4xl text-text-primary">Display Heading</h1>
                <h2 className="font-display text-2xl text-text-primary">Section Heading</h2>
                <p className="text-text-secondary">
                  Body text with secondary color for regular content. Uses Inter font family for optimal readability.
                </p>
                <p className="font-mono text-sm text-text-tertiary">
                  Monospace text for code or data displays.
                </p>
              </div>
            </div>

            {/* Component Showcase */}
            <div className="cds-card-cinematic p-6">
              <h2 className="text-text-primary font-display text-2xl mb-4">Interactive Components</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-secondary">Input Field</label>
                  <input 
                    type="text" 
                    className="cds-input-cinematic" 
                    placeholder="Enter case details..."
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-secondary">Progress Indicator</label>
                  <progress 
                    className="cds-progress-cinematic w-full" 
                    value={progress} 
                    max="100"
                  />
                  <div className="flex justify-between text-xs text-text-tertiary">
                    <span>0%</span>
                    <span>{progress}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="flex gap-3 items-center">
                  <div className="cds-status-indicator"></div>
                  <span className="text-sm text-text-secondary">Active Case</span>
                  
                  <div className="cds-status-indicator cds-status-indicator--warning ml-4"></div>
                  <span className="text-sm text-text-secondary">Review Needed</span>
                  
                  <div className="cds-status-indicator cds-status-indicator--error ml-4"></div>
                  <span className="text-sm text-text-secondary">Urgent</span>
                </div>
              </div>
            </div>

            {/* Glowing Elements */}
            <div className="cds-card-cinematic p-6">
              <h2 className="text-text-primary font-display text-2xl mb-4">Glowing Effects</h2>
              
              <div className="flex flex-col gap-6 items-center justify-center h-full">
                <div 
                  className={`cds-node-glow w-24 h-24 flex items-center justify-center ${
                    isGlowing ? 'cds-animate-node-glow' : ''
                  }`}
                >
                  <span className="cds-text-holo font-display text-xl">AI</span>
                </div>
                
                <div className="flex gap-4">
                  <div className="cds-glow-cyan-xs w-12 h-12 rounded-full"></div>
                  <div className="cds-glow-violet-xs w-12 h-12 rounded-full"></div>
                  <div className="cds-glow-cyan-md w-12 h-12 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Showcase */}
          <div className="cds-card-cinematic p-6 mt-8">
            <h2 className="text-text-primary font-display text-2xl mb-4">Dashboard Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-background-panel rounded-xl p-5 border border-border-default">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-secondary text-sm">Cases Processed</p>
                    <p className="font-display text-3xl text-text-primary mt-1">142</p>
                  </div>
                  <div className="cds-status-indicator"></div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-accent-green">+12%</span>
                  <span className="text-xs text-text-secondary ml-2">from last week</span>
                </div>
              </div>
              
              <div className="bg-background-panel rounded-xl p-5 border border-border-default">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-secondary text-sm">Evidence Files</p>
                    <p className="font-display text-3xl text-text-primary mt-1">1,284</p>
                  </div>
                  <div className="cds-status-indicator cds-status-indicator--warning"></div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-accent-gold">+5.3%</span>
                  <span className="text-xs text-text-secondary ml-2">from last week</span>
                </div>
              </div>
              
              <div className="bg-background-panel rounded-xl p-5 border border-border-default">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-secondary text-sm">AI Accuracy</p>
                    <p className="font-display text-3xl text-text-primary mt-1">94.7%</p>
                  </div>
                  <div className="cds-status-indicator"></div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-accent-green">+2.1%</span>
                  <span className="text-xs text-text-secondary ml-2">from last week</span>
                </div>
              </div>
              
              <div className="bg-background-panel rounded-xl p-5 border border-border-default">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-secondary text-sm">Team Productivity</p>
                    <p className="font-display text-3xl text-text-primary mt-1">87%</p>
                  </div>
                  <div className="cds-status-indicator"></div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-accent-green">+8.4%</span>
                  <span className="text-xs text-text-secondary ml-2">from last week</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}