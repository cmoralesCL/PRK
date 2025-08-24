
'use client';

import { useState, useTransition, ReactNode } from 'react';
import { AddOrbitDialog } from './add-life-prk-dialog';
import { DialogContext, DialogProvider } from '@/hooks/use-dialog';
import type { Orbit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addOrbit, updateOrbit } from '@/app/actions';

export function PageWrapper({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isOrbitDialogOpen, setOrbitDialogOpen] = useState(false);
    const [editingOrbit, setEditingOrbit] = useState<Orbit | null>(null);

    const handleOpen = (orbit?: Orbit | null) => {
        setEditingOrbit(orbit || null);
        setOrbitDialogOpen(true);
    };

    const handleSaveOrbit = (values: { title: string; description?: string }) => {
        startTransition(async () => {
            try {
                if (editingOrbit) {
                    await updateOrbit(editingOrbit.id, values);
                    toast({ title: '¡Órbita Actualizada!', description: `Se ha actualizado "${values.title}".` });
                } else {
                    await addOrbit(values);
                    toast({ title: '¡Órbita Agregada!', description: `"${values.title}" es ahora uno de tus pilares de vida.` });
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la Órbita.' });
            }
        });
    };

    return (
        <DialogProvider value={{ onOpen: handleOpen, setOrbitToEdit: handleOpen }}>
            {children}
            <AddOrbitDialog
                isOpen={isOrbitDialogOpen}
                onOpenChange={setOrbitDialogOpen}
                onSave={handleSaveOrbit}
                orbit={editingOrbit}
            />
        </DialogProvider>
    );
}
