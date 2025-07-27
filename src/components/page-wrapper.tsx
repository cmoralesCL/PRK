
'use client';

import { useState, useTransition, ReactNode } from 'react';
import { AddLifePrkDialog } from './add-life-prk-dialog';
import { DialogContext, DialogProvider } from '@/hooks/use-dialog';
import type { LifePrk } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addLifePrk, updateLifePrk } from '@/app/actions';

export function PageWrapper({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isLifePrkDialogOpen, setLifePrkDialogOpen] = useState(false);
    const [editingLifePrk, setEditingLifePrk] = useState<LifePrk | null>(null);

    const handleOpen = (lifePrk?: LifePrk | null) => {
        setEditingLifePrk(lifePrk || null);
        setLifePrkDialogOpen(true);
    };

    const handleSaveLifePrk = (values: { title: string; description?: string }) => {
        startTransition(async () => {
            try {
                if (editingLifePrk) {
                    await updateLifePrk(editingLifePrk.id, values);
                    toast({ title: '¡PRK de Vida Actualizado!', description: `Se ha actualizado "${values.title}".` });
                } else {
                    await addLifePrk(values);
                    toast({ title: '¡PRK de Vida Agregado!', description: `"${values.title}" es ahora tu estrella guía.` });
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el PRK de Vida.' });
            }
        });
    };

    return (
        <DialogProvider value={{ onOpen: handleOpen, setLifePrkToEdit: handleOpen }}>
            {children}
            <AddLifePrkDialog
                isOpen={isLifePrkDialogOpen}
                onOpenChange={setLifePrkDialogOpen}
                onSave={handleSaveLifePrk}
                lifePrk={editingLifePrk}
            />
        </DialogProvider>
    );
}
