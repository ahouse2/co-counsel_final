import React, { createContext, useContext, useEffect, useState } from 'react';
import { useHaloContext } from './HaloContext';

export type CaseInfo = {
  id: string;
  name?: string;
  metadata?: any;
};

export type CaseContextValue = {
  activeCase: CaseInfo | null;
  setActiveCase: (id: string | null) => void;
  permissions: string[];
  setPermissions: (perms: string[]) => void;
};

export const CaseContext = createContext<CaseContextValue | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCase, setActiveCaseState] = useState<CaseInfo | null>(null);
  const [permissions, setPermissionsState] = useState<string[]>([]);
  const haloCtx = useHaloContext();

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cc_case_context');
      if (raw) {
        const parsed = JSON.parse(raw) as { activeCase?: CaseInfo; permissions?: string[] };
        if (parsed.activeCase) setActiveCaseState(parsed.activeCase);
        if (Array.isArray(parsed.permissions)) setPermissionsState(parsed.permissions);
      }
    } catch {
      // ignore
    }
  }, []);

  // persist to localStorage
  useEffect(() => {
    const payload = { activeCase, permissions };
    localStorage.setItem('cc_case_context', JSON.stringify(payload));
  }, [activeCase, permissions]);

  // try to fetch current case from backend (best-effort)
  useEffect(() => {
    const load = async () => {
      try {
        const apiBase = (import.meta?.env?.VITE_API_BASE_URL ?? '/api');
        const res = await fetch(`${apiBase}/cases/current`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.id) {
            setActiveCaseState({ id: data.id, name: data.name, metadata: data });
          }
        }
        // Bootstrap halo context if available
        try {
          const haloApi = `${apiBase}/bootstrap`;
          const haloRes = await fetch(haloApi, { credentials: 'include' });
          if (haloRes.ok) {
            const haloData = await haloRes.json();
            // @ts-ignore - haloCtx may be undefined in tests; use safe path
            if (haloData?.activeModuleId && haloCtx?.setActiveModuleId) haloCtx.setActiveModuleId(haloData.activeModuleId);
            if (haloData?.activeSubmoduleId && haloCtx?.setActiveSubmoduleId) haloCtx.setActiveSubmoduleId(haloData.activeSubmoduleId);
          }
        } catch {
          // ignore halo bootstrap failures during initial bootstrap
        }
      } catch {
        // ignore network failures in this speculative integration
      }
    };
    load();
  }, []);

  const setActiveCase = (id: string | null) => {
    if (id === null) {
      setActiveCaseState(null);
    } else {
      setActiveCaseState({ id, name: undefined });
    }
  };

  const value: CaseContextValue = {
    activeCase,
    setActiveCase,
    permissions,
    setPermissions: setPermissionsState,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

export const useCaseContext = (): CaseContextValue => {
  const ctx = useContext(CaseContext);
  if (!ctx) {
    return {
      activeCase: null,
      setActiveCase: () => {},
      permissions: [],
      setPermissions: () => {},
    };
  }
  return ctx;
};
