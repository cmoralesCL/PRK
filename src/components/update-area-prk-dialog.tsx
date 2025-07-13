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
  currentValue: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateAreaPrkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: (values: FormValues) => void;
  areaPrk: AreaPrk | null;
}

export function UpdateAreaPrkDialog({ isOpen, onOpenChange, onUpdate, areaPrk }: UpdateAreaPrkDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (areaPrk) {
      form.reset({ currentValue: areaPrk.currentValue });
    }
  }, [areaPrk, form]);


  const onSubmit = (values: FormValues) => {
    onUpdate(values);
    onOpenChange(false);
  };

  if (!areaPrk) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Registrar Progreso</DialogTitle>
          <DialogDescription>
            Actualiza tu progreso actual para "{areaPrk.title}". Tu objetivo es {areaPrk.targetValue} {areaPrk.unit}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Actual</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Actualizar Progreso</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
