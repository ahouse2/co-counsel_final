import React, { createContext, useContext, useEffect, useState } from 'react';

export type HaloContextValue = {
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  activeSubmoduleId: string;
  setActiveSubmoduleId: (id: string) => void;
  viewportPayload?: any;
  setViewportPayload?: (payload: any) => void;
};

export const HaloContext = createContext<HaloContextValue | undefined>(undefined);

export const HaloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModuleId, setActiveModuleIdState] = useState<string>('graph');
  const [activeSubmoduleId, setActiveSubmoduleIdState] = useState<string>('vector');
  const [viewportPayload, setViewportPayloadState] = useState<any>(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cc_halo_context');
      if (raw) {
        const p = JSON.parse(raw) as { activeModuleId?: string; activeSubmoduleId?: string; viewportPayload?: any };
        if (p.activeModuleId) setActiveModuleIdState(p.activeModuleId);
        if (p.activeSubmoduleId) setActiveSubmoduleIdState(p.activeSubmoduleId);
        if (p.viewportPayload) setViewportPayloadState(p.viewportPayload);
      }
    } catch {
      // ignore
    }
  }, []);

  // persist to localStorage
  useEffect(() => {
    const payload = { activeModuleId, activeSubmoduleId, viewportPayload };
    localStorage.setItem('cc_halo_context', JSON.stringify(payload));
  }, [activeModuleId, activeSubmoduleId, viewportPayload]);

  const value: HaloContextValue = {
    activeModuleId,
    setActiveModuleId: setActiveModuleIdState,
    activeSubmoduleId,
    setActiveSubmoduleId: setActiveSubmoduleIdState,
    viewportPayload,
    setViewportPayload: setViewportPayloadState,
  };

  return <HaloContext.Provider value={value}>{children}</HaloContext.Provider>;
};

export const useHaloContext = (): HaloContextValue => {
  const ctx = useContext(HaloContext);
  if (!ctx) {
    return {
      activeModuleId: 'graph',
      setActiveModuleId: () => {},
      activeSubmoduleId: 'vector',
      setActiveSubmoduleId: () => {},
      viewportPayload: undefined,
      setViewportPayload: () => {},
    };
  }
  return ctx;
};
