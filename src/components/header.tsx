'use client';

import { Compass, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddLifePrk: () => void;
}

export function Header({ onAddLifePrk }: HeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Compass className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Personal Results Compass
            </h1>
          </div>
          <Button onClick={onAddLifePrk} variant="default" className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Life PRK
          </Button>
        </div>
      </div>
    </header>
  );
}
