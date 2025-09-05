import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppMode = 'edit' | 'demo';

interface ModeContextType {
  mode: AppMode;
  toggleMode: () => void;
  isEditMode: boolean;
  isDemoMode: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider = ({ children }: ModeProviderProps) => {
  // Initialize from localStorage or default to 'edit' mode for sandbox environments
  const getInitialMode = (): AppMode => {
    const savedMode = localStorage.getItem('lovable-app-mode') as AppMode;
    if (savedMode === 'edit' || savedMode === 'demo') {
      return savedMode;
    }
    
    // Default to edit mode for sandbox/lovable environments, demo mode otherwise
    const isLovableEnv = window.location.hostname.includes('lovable.app') || 
                         window.location.hostname.includes('sandbox.lovable.dev');
    return isLovableEnv ? 'edit' : 'demo';
  };

  const [mode, setMode] = useState<AppMode>(getInitialMode);

  const toggleMode = () => {
    const newMode = mode === 'edit' ? 'demo' : 'edit';
    setMode(newMode);
    localStorage.setItem('lovable-app-mode', newMode);
  };

  const isEditMode = mode === 'edit';
  const isDemoMode = mode === 'demo';

  return (
    <ModeContext.Provider value={{ mode, toggleMode, isEditMode, isDemoMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};