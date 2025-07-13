// This file is no longer used for fetching initial data, 
// as data is now fetched directly from Supabase in src/app/server/queries.ts.
// It can be deleted or kept for reference.

import type { LifePrk, AreaPrk, HabitTask } from './types';

export const getInitialData = (): { lifePrks: LifePrk[], areaPrks: AreaPrk[], habitTasks: HabitTask[] } => ({
  lifePrks: [],
  areaPrks: [],
  habitTasks: [],
});
