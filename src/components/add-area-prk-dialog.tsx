'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Phase } from '@/lib/types';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'El título debe tener al menos 3 caracteres.',
  }),
  description: z.string().optional(),
});

export type PhaseFormValues = z.infer<typeof formSchema>;

interface AddPhaseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: PhaseFormValues) => void;
  phase: Phase | null;
}

export function AddPhaseDialog({ isOpen, onOpenChange, onSave, phase }: AddPhaseDialogProps) {
  const isEditing = !!phase;

  const form = useForm<PhaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditing && phase) {
            form.reset({
                title: phase.title,
                description: phase.description || '',
            });
        } else {
            form.reset({
                title: '',
                description: '',
            });
        }
    }
  }, [isOpen, isEditing, phase, form]);


  const onSubmit = (values: PhaseFormValues) => {
    onSave(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? 'Editar Fase' : 'Crear una Fase'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
                ? 'Actualiza los detalles de este proyecto o meta.'
                : 'Una Fase es un proyecto o meta medible que contribuye a una de tus Órbitas.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Mejorar mi salud cardiovascular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define cómo se ve el éxito para esta Fase."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Agregar Fase'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
