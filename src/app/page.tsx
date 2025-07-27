
import * as React from 'react';
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect('/panel');
}
