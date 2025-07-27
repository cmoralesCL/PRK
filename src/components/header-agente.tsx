
'use client';

import { Compass, Plus, Calendar as CalendarIcon, Bot, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function HeaderAgente() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { href: "/panel", label: "Panel", icon: Compass },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
    { href: "/agente", label: "Agente", icon: Bot },
  ];

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
          </div>
        </div>
      </div>
    </header>
  );
}
