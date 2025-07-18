'use client';

import { Compass, Plus, Calendar as CalendarIcon, BookOpen, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


interface HeaderProps {
  onAddLifePrk: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  hideDatePicker?: boolean;
  hideAddButton?: boolean;
}

export function Header({ onAddLifePrk, selectedDate, onDateChange, hideDatePicker = false, hideAddButton = false }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
                <Compass className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline text-foreground">
                Brújula de Resultados Personales
                </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!hideDatePicker && (
                 <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant={'outline'}
                     className={cn(
                       'w-[280px] justify-start text-left font-normal',
                       !selectedDate && 'text-muted-foreground'
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0">
                   <Calendar
                     mode="single"
                     selected={selectedDate}
                     onSelect={(date) => date && onDateChange(date)}
                     initialFocus
                   />
                 </PopoverContent>
               </Popover>
            )}

             <Link href="/calendar">
                <Button variant={pathname === '/calendar' ? 'secondary' : 'outline'} className="shadow-md">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Calendario
                </Button>
            </Link>
             <Link href="/journal">
                <Button variant={pathname === '/journal' ? 'secondary' : 'outline'} className="shadow-md">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Diario
                </Button>
            </Link>
           
            {!hideAddButton && (
                 <Button onClick={onAddLifePrk} variant="default" className="shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar PRK de Vida
                </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
