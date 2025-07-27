
import * as React from 'react';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {

  return (
    <>
        <Header hideDatePicker={true} />
    </>
  );
}
