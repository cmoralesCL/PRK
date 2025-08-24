'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';
import { Check } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import type { LifePrk, ColorTheme } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { THEMES } from '@/lib/themes';

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'El título debe tener al menos 3 caracteres.',
  }),
  description: z.string().optional(),
  color_theme: z.custom<ColorTheme>().optional().default('mint'),
});

type FormValues = z.infer<typeof formSchema>;

interface LifePrkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: FormValues) => void;
  lifePrk: LifePrk | null;
}

export function AddLifePrkDialog({ isOpen, onOpenChange, onSave, lifePrk }: LifePrkDialogProps) {
  const isEditing = !!lifePrk;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      color_theme: 'mint',
    },
  });

  useEffect(() => {
    if(isOpen) {
      if (isEditing && lifePrk) {
        form.reset({
          title: lifePrk.title,
          description: lifePrk.description,
          color_theme: lifePrk.color_theme || 'mint',
        });
      } else {
        form.reset({
          title: '',
          description: '',
          color_theme: 'mint',
        });
      }
    }
  }, [isOpen, isEditing, lifePrk, form]);

  const onSubmit = (values: FormValues) => {
    onSave(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? 'Editar PRK de Vida' : 'Definir un Nuevo PRK de Vida'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los detalles de tu visión a largo plazo.'
              : 'Esta es una visión de vida a largo plazo, tu estrella guía. ¿Qué quieres lograr?'
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
                    <Input placeholder="Ej: Alcanzar la Independencia Financiera" {...field} />
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
                      placeholder="Describe cómo se ve esto cuando lo hayas logrado."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color_theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color del Tema</FormLabel>
                   <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-4 pt-2"
                    >
                      {Object.entries(THEMES).map(([themeKey, themeValue]) => (
                         <FormItem key={themeKey}>
                            <FormControl>
                                <RadioGroupItem value={themeKey} id={themeKey} className="peer sr-only" />
                            </FormControl>
                             <FormLabel
                              htmlFor={themeKey}
                              className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              )}
                            >
                                <div className="flex items-center justify-center w-full gap-2">
                                    <span className="w-5 h-5 rounded-full" style={{ background: themeValue.gradient }}></span>
                                    <span className="text-sm font-medium">{themeValue.name}</span>
                                </div>
                            </FormLabel>
                         </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Agregar PRK'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
