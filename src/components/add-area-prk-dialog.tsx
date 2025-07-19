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
import type { AreaPrk } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'El título debe tener al menos 3 caracteres.',
  }),
  unit: z.string().min(1, { message: 'La unidad es requerida.' }),
});

export type AreaPrkFormValues = z.infer<typeof formSchema>;

interface AddAreaPrkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: AreaPrkFormValues) => void;
  areaPrk: AreaPrk | null;
}

export function AddAreaPrkDialog({ isOpen, onOpenChange, onSave, areaPrk }: AddAreaPrkDialogProps) {
  const isEditing = !!areaPrk;

  const form = useForm<AreaPrkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      unit: '%',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditing && areaPrk) {
            form.reset({
                title: areaPrk.title,
                unit: areaPrk.unit,
            });
        } else {
            form.reset({
                title: '',
                unit: '%',
            });
        }
    }
  }, [isOpen, isEditing, areaPrk, form]);


  const onSubmit = (values: AreaPrkFormValues) => {
    onSave(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? 'Editar PRK de Área' : 'Establecer un PRK de Área'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
                ? 'Actualiza los detalles de este resultado medible.'
                : 'Este es un resultado medible que contribuye a tu PRK de Vida.'
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Progreso</FormLabel>
                  <FormControl>
                    <Input placeholder="%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Agregar PRK de Área'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
