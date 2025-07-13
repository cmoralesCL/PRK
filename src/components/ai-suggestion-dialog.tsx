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
import type { KeyPrk } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AiSuggestionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddSuggestion: (title: string) => void;
  keyPrk: KeyPrk | null;
}

export function AiSuggestionDialog({ isOpen, onOpenChange, onAddSuggestion, keyPrk }: AiSuggestionDialogProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && keyPrk && suggestions.length === 0) {
      startTransition(async () => {
        try {
          const result = await getAiSuggestions({ keyPrk: keyPrk.title });
          setSuggestions(result);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "AI Suggestion Failed",
                description: "Could not fetch suggestions. Please try again later.",
            });
        }
      });
    } else if (!isOpen) {
      setSuggestions([]);
    }
  }, [isOpen, keyPrk, toast]);

  const handleAdd = (suggestion: string) => {
    onAddSuggestion(suggestion);
    setSuggestions(current => current.filter(s => s !== suggestion));
    toast({
        title: "Added!",
        description: `"${suggestion}" has been added to your tasks.`,
    })
  };

  if (!keyPrk) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Suggestions
          </DialogTitle>
          <DialogDescription>
            Here are some AI-powered suggestions to help you achieve "{keyPrk.title}".
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
                        <p className="text-sm text-muted-foreground text-center py-8">No suggestions found. Try again later.</p>
                    )}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
