'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiSuggestions } from '@/app/actions';
import type { AreaPrk } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AiSuggestionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddSuggestion: (title: string) => void;
  areaPrk: AreaPrk | null;
}

export function AiSuggestionDialog({ isOpen, onOpenChange, onAddSuggestion, areaPrk }: AiSuggestionDialogProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && areaPrk && suggestions.length === 0) {
      startTransition(async () => {
        try {
          const result = await getAiSuggestions({ keyPrk: areaPrk.title });
          setSuggestions(result);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error en la Sugerencia de IA",
                description: "No se pudieron obtener las sugerencias. Por favor, inténtalo más tarde.",
            });
        }
      });
    } else if (!isOpen) {
      setSuggestions([]);
    }
  }, [isOpen, areaPrk, toast]);

  const handleAdd = (suggestion: string) => {
    onAddSuggestion(suggestion);
    setSuggestions(current => current.filter(s => s !== suggestion));
    toast({
        title: "¡Agregado!",
        description: `"${suggestion}" ha sido añadido a tus tareas.`,
    })
  };

  if (!areaPrk) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugerencias de IA
          </DialogTitle>
          <DialogDescription>
            Aquí tienes algunas sugerencias de la IA para ayudarte a lograr "{areaPrk.title}".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 pr-4">
            {isPending ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-2">
                    {suggestions.length > 0 ? suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
                        <p className="text-sm text-secondary-foreground">{suggestion}</p>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleAdd(suggestion)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No se encontraron sugerencias. Inténtalo de nuevo más tarde.</p>
                    )}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
