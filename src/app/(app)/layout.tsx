'use client';

import { PageWrapper } from "@/components/page-wrapper";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <PageWrapper>
            <div className="flex flex-col h-screen">
                <AppHeader />
                <main className="flex-1 overflow-y-auto pb-24">
                    {children}
                </main>
                <BottomNavBar />
            </div>
        </PageWrapper>
    );
}
