
'use client';
import { createContext, useContext } from 'react';
import type { LifePrk } from '@/lib/types';

interface DialogContextType {
    onOpen: () => void;
    setLifePrkToEdit: (lifePrk: LifePrk | null) => void;
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}

export const DialogProvider = DialogContext.Provider;
