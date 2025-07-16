'use client';

import { getJournalData } from '@/app/server/queries';
import { JournalView } from '@/components/journal-view';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import type { JournalEntry } from '@/lib/types';

export default function JournalPage() {
  const [journalData, setJournalData] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getJournalData();
        setJournalData(data);
      } catch (error) {
        console.error("Failed to fetch journal data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Header
        onAddLifePrk={() => {}}
        selectedDate={new Date()}
        onDateChange={() => {}}
        hideDatePicker
        hideAddButton
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Diario Evolutivo</h1>
            <p className="mt-1 text-muted-foreground">
              Un registro cronológico de tu progreso y logros.
            </p>
          </div>
          {loading ? (
            <div className="text-center py-24">
              <h2 className="text-2xl font-headline font-semibold">Cargando diario...</h2>
            </div>
          ) : (
            <JournalView journalData={journalData} />
          )}
        </div>
      </main>
    </>
  );
}
