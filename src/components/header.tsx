
'use client';

import { Compass, Plus, Calendar as CalendarIcon, LogOut, BarChart2, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';


interface HeaderProps {
  showAuth?: boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  hideDatePicker?: boolean;
}

export function Header({ 
  showAuth = true,
  selectedDate,
  onDateChange,
  hideDatePicker = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { onOpen } = useDialog();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Update time every second on the client
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // Set initial time on mount
    setCurrentTime(new Date());
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { href: "/panel", label: "Panel", icon: Compass },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
    { href: "/analytics", label: "Analíticas", icon: LineChart },
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
            {currentTime && (
                <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md hidden lg:block">
                    {format(currentTime, 'Pp', { locale: es })}
                </div>
            )}
            {!hideDatePicker && selectedDate && onDateChange && (
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("w-[240px] justify-start text-left font-normal")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={onDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}
            <Button onClick={() => onOpen()} variant="default" className="shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">PRK de Vida</span>
                <span className="sm:hidden">PRK</span>
            </Button>

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
