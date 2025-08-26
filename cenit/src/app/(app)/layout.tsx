'use client';

import { PageWrapper } from "@/components/page-wrapper";
import { BottomNavBar } from "@/components/bottom-nav-bar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <PageWrapper>
            <div className="flex flex-col h-screen">
                <main className="flex-1 overflow-y-auto pb-24">
                    {children}
                </main>
                <BottomNavBar />
            </div>
        </PageWrapper>
    );
}
