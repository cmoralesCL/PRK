
'use client';

import { Sidebar, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { PageWrapper } from "@/components/page-wrapper";
import { Compass, Calendar as CalendarIcon, BarChart2, LineChart, CheckSquare, Sun, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navLinks = [
        { href: "/day", label: "Mi Día", icon: Sun },
        { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
        { href: "/panel", label: "Panel", icon: Compass },
        { href: "/calendar", label: "Calendario", icon: CalendarIcon },
        { href: "/analytics", label: "Analíticas", icon: LineChart },
        { href: "/tasks", label: "Tareas", icon: CheckSquare },
    ];

    return (
        <PageWrapper>
            <SidebarProvider>
                <Sidebar>
                    <SidebarMenu>
                        {navLinks.map(link => (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton asChild isActive={pathname.startsWith(link.href)}>
                                    <Link href={link.href}>
                                        <link.icon />
                                        <span>{link.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </Sidebar>
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
            </SidebarProvider>
        </PageWrapper>
    );
}
