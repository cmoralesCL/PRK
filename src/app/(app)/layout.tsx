
'use client';

import { Sidebar, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { PageWrapper } from "@/components/page-wrapper";
import { Compass, Calendar as CalendarIcon, LineChart, CheckSquare, Sun, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navLinks = [
        { href: "/day", label: "Mi Día", icon: Sun },
        { href: "/panel", label: "Panel", icon: Compass },
        { href: "/objetivos", label: "Objetivos", icon: Target },
        { href: "/calendar", label: "Calendario", icon: CalendarIcon },
        { href: "/analytics", label: "Analíticas", icon: LineChart },
        { href: "/tasks", label: "Tareas", icon: CheckSquare },
    ];

    return (
        <PageWrapper>
            <SidebarProvider>
                <div className="flex">
                    <Sidebar>
                        <SidebarMenu>
                            {navLinks.map(link => (
                                <SidebarMenuItem key={link.href}>
                                    <SidebarMenuButton asChild isActive={pathname.startsWith(link.href)}>
                                        <Link href={link.href}>
                                            <link.icon className="h-6 w-6" />
                                            <span className="group-data-[state=collapsed]:hidden">{link.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </Sidebar>
                    <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                        {children}
                    </main>
                </div>
            </SidebarProvider>
        </PageWrapper>
    );
}
