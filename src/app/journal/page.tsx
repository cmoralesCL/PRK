import { getJournalData } from '@/app/server/queries';
import { JournalView } from '@/components/journal-view';
import { Header } from '@/components/header';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const data = await getJournalData();

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
          <JournalView journalData={data} />
        </div>
      </main>
    </>
  );
}
