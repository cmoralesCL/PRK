'use client';

import { Compass, Calendar as CalendarIcon, LineChart, CheckSquare, Sun, Plus, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/use-dialog";
import { Button } from "./ui/button";

export function BottomNavBar() {
    const pathname = usePathname();
    const { onOpen } = useDialog(); // Assuming this is for adding a LifePrk/Orbit. We may need a different one for Pulse.

    // This is a placeholder. A more robust solution would involve a dedicated dialog context for pulses.
    // For now, we assume the FAB on Day page opens AddPulseDialog, which is handled in DayView.
    // This button will optimistically open the main Add dialog.
    const handleFabClick = () => {
         // This is a trick. DayView has a hidden button that this click will trigger.
         // A better solution would use a global state/context for dialogs.
         const dayViewFab = document.getElementById('day-view-fab-trigger') as HTMLButtonElement | null;
         if (dayViewFab) {
            dayViewFab.click();
         } else {
            onOpen(); // Fallback to opening the Orbit dialog
         }
    };

    const navLinks = [
        { href: "/day", label: "Mi Día", icon: Sun },
        { href: "/panel", label: "Panel", icon: Compass },
        { href: "/analytics", label: "Analíticas", icon: LineChart },
        { href: "/tasks", label: "Tareas", icon: CheckSquare },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-card/95 backdrop-blur-sm border-t z-50">
            <div className="relative flex items-center justify-around h-full max-w-2xl mx-auto">
                {navLinks.map((link, index) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <React.Fragment key={link.href}>
                            {/* Placeholder for the FAB */}
                            {index === 2 && <div className="w-16 h-16" />}
                            
                            <Link href={link.href} className="flex flex-col items-center justify-center w-1/5 h-full text-center">
                                <link.icon className={cn(
                                    "h-6 w-6 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "text-xs mt-1 transition-colors",
                                     isActive ? "text-primary font-semibold" : "text-muted-foreground"
                                )}>
                                    {link.label}
                                </span>
                            </Link>
                        </React.Fragment>
                    );
                })}

                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                     <Button
                        onClick={handleFabClick}
                        size="icon"
                        className="rounded-full w-16 h-16 bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Dummy React import to satisfy compiler if React is not used elsewhere in the file
import * as React from 'react';
