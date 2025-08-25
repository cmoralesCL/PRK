'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { LogOut } from 'lucide-react';

interface AppHeaderProps {
    userEmail?: string | null;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-14 items-center px-2 sm:px-4 lg:px-6">
                <div className="flex flex-1 items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {userEmail && (
                            <>
                                Conectado como <span className="font-semibold text-foreground">{userEmail}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
