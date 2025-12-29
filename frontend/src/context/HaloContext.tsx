import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { endpoints } from '../services/api';

export type ModuleId =
    | 'graph'
    | 'chat'
    | 'timeline'
    | 'documents'
    | 'university'
    | 'arena'
    | 'context'
    | 'theory'
    | 'forensics'
    | 'binder'
    | 'research'
    | 'drafting'
    | 'presentation'
    | 'process'
    | 'agents'
    | 'mootcourt'
    | 'evidencemap'
    | 'jurysentiment'
    | 'classification'
    | 'narrative'
    | 'devils_advocate'
    | 'jury'
    | 'interview'
    | 'dashboard'
    | 'assethunter';

export type SubmoduleId = string | null;

export interface CaseInfo {
    id: string;
    case_number?: string;
    name: string;
    description?: string;
    status: string;
}

interface HaloContextType {
    // Module navigation
    activeModule: ModuleId;
    setActiveModule: (module: ModuleId) => void;
    activeSubmodule: SubmoduleId;
    setActiveSubmodule: (submodule: SubmoduleId) => void;

    // UI state
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;

    // Case management
    caseId: string;
    setCaseId: (id: string) => void;
    cases: CaseInfo[];
    refreshCases: () => Promise<void>;
    createCase: (name: string, description?: string) => Promise<CaseInfo | null>;

    // Proactive Insights
    insights: any[];
    refreshInsights: () => Promise<void>;
}

const HaloContext = createContext<HaloContextType | undefined>(undefined);

const STORAGE_KEY = 'co_counsel_case_id';

export function HaloProvider({ children }: { children: ReactNode }) {
    const [activeModule, setActiveModule] = useState<ModuleId>('graph');
    const [activeSubmodule, setActiveSubmodule] = useState<SubmoduleId>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Case management with persistence
    const [caseId, setCaseIdState] = useState<string>(() => {
        // Load from localStorage on init
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored || 'default_case';
    });
    const [cases, setCases] = useState<CaseInfo[]>([]);

    // Persist caseId to localStorage when it changes
    const setCaseId = useCallback((id: string) => {
        setCaseIdState(id);
        localStorage.setItem(STORAGE_KEY, id);
    }, []);

    // Fetch all cases from API
    const refreshCases = useCallback(async () => {
        try {
            const response = await endpoints.cases.list();
            setCases(response.data || []);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
        }
    }, []);

    // Create a new case
    const createCase = useCallback(async (name: string, description?: string): Promise<CaseInfo | null> => {
        try {
            const response = await endpoints.cases.create({ name, description });
            const newCase = response.data;
            await refreshCases();
            setCaseId(newCase.id);
            return newCase;
        } catch (error) {
            console.error('Failed to create case:', error);
            return null;
        }
    }, [refreshCases, setCaseId]);

    // Fetch cases on mount
    useEffect(() => {
        refreshCases();
    }, [refreshCases]);

    // Insights state
    const [insights, setInsights] = useState<any[]>([]);

    // Fetch insights
    const refreshInsights = useCallback(async () => {
        if (!caseId) return;
        try {
            const response = await endpoints.insights.get(caseId);
            setInsights(response.data.insights || []);
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        }
    }, [caseId]);

    // Poll for insights
    useEffect(() => {
        refreshInsights();
        const interval = setInterval(refreshInsights, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [refreshInsights]);

    return (
        <HaloContext.Provider value={{
            activeModule,
            setActiveModule,
            activeSubmodule,
            setActiveSubmodule,
            isMenuOpen,
            setIsMenuOpen,
            isSettingsOpen,
            setIsSettingsOpen,
            caseId,
            setCaseId,
            cases,
            refreshCases,
            createCase,
            insights,
            refreshInsights
        }}>
            {children}
        </HaloContext.Provider>
    );
}

export function useHalo() {
    const context = useContext(HaloContext);
    if (context === undefined) {
        throw new Error('useHalo must be used within a HaloProvider');
    }
    return context;
}

