
'use client';

import { Compass, Plus, Calendar as CalendarIcon, LogOut, BarChart2 } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  onAddLifePrk?: () => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  hideDatePicker?: boolean;
  hideAddButton?: boolean;
  datePickerLabel?: string;
  showAuth?: boolean;
}

export function Header({ 
  onAddLifePrk, 
  selectedDate, 
  onDateChange, 
  hideDatePicker = false, 
  hideAddButton = false,
  datePickerLabel = "Fecha",
  showAuth = true,
}: HeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { href: "/panel", label: "Panel", icon: Compass },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3">
                <Compass className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold font-headline text-foreground hidden sm:block">
                Brújula de Resultados
                </h1>
            </Link>
            {showAuth && (
              <nav className="flex items-center gap-1">
                  {navLinks.map(link => (
                      <Button key={link.href} variant={pathname.startsWith(link.href) ? "secondary" : "ghost"} asChild>
                          <Link href={link.href}>
                              <link.icon className="h-4 w-4 sm:mr-2"/>
                              <span className="hidden sm:inline">{link.label}</span>
                          </Link>
                      </Button>
                  ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!hideDatePicker && selectedDate && onDateChange && (
                 <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant={'outline'}
                     className={cn(
                       'w-[240px] justify-start text-left font-normal',
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
           
            {!hideAddButton && onAddLifePrk && (
                 <Button onClick={onAddLifePrk} variant="default" className="shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">PRK de Vida</span>
                </Button>
            )}

            {showAuth && (
              <Button onClick={handleSignOut} variant="ghost" size="icon" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
