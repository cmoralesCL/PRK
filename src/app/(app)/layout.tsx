'use server';

import { PageWrapper } from "@/components/page-wrapper";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <PageWrapper>
            <div className="flex flex-col h-screen">
                <AppHeader userEmail={user.email} />
                <main className="flex-1 overflow-y-auto pb-24">
                    {children}
                </main>
                <BottomNavBar />
            </div>
        </PageWrapper>
    );
}
