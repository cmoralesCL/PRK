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
import type { KeyPrk } from '@/lib/types';

const formSchema = z.object({
  currentValue: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateKeyPrkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: (values: FormValues) => void;
  keyPrk: KeyPrk | null;
}

export function UpdateKeyPrkDialog({ isOpen, onOpenChange, onUpdate, keyPrk }: UpdateKeyPrkDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (keyPrk) {
      form.reset({ currentValue: keyPrk.currentValue });
    }
  }, [keyPrk, form]);


  const onSubmit = (values: FormValues) => {
    onUpdate(values);
    onOpenChange(false);
  };

  if (!keyPrk) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Log Progress</DialogTitle>
          <DialogDescription>
            Update your current progress for "{keyPrk.title}". Your target is {keyPrk.targetValue} {keyPrk.unit}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Update Progress</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
