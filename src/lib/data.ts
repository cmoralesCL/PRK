import type { LifePrk, KeyPrk, HabitTask } from './types';

const lifePrks: LifePrk[] = [
  {
    id: 'life-1',
    title: 'Achieve Financial Independence',
    description: 'Build enough wealth to live off investments and passive income streams, providing freedom and security.',
  },
  {
    id: 'life-2',
    title: 'Cultivate a Healthy and Active Lifestyle',
    description: 'Prioritize physical and mental well-being to live a long, energetic, and fulfilling life.',
  },
];

const keyPrks: KeyPrk[] = [
  {
    id: 'key-1',
    lifePrkId: 'life-1',
    title: 'Investment Portfolio Value',
    currentValue: 250000,
    targetValue: 1000000,
    unit: 'USD',
  },
  {
    id: 'key-2',
    lifePrkId: 'life-1',
    title: 'Annual Passive Income',
    currentValue: 5000,
    targetValue: 40000,
    unit: 'USD',
  },
  {
    id: 'key-3',
    lifePrkId: 'life-2',
    title: 'Maintain Healthy Body Weight',
    currentValue: 80,
    targetValue: 75,
    unit: 'kg',
  },
  {
    id: 'key-4',
    lifePrkId: 'life-2',
    title: 'Read Books',
    currentValue: 5,
    targetValue: 24,
    unit: 'books',
  },
];

const habitTasks: HabitTask[] = [
  { id: 'task-1', keyPrkId: 'key-1', title: 'Invest $1000 into index funds', type: 'habit', completed: false },
  { id: 'task-2', keyPrkId: 'key-1', title: 'Review quarterly investment performance', type: 'task', completed: false },
  { id: 'task-3', keyPrkId: 'key-2', title: 'Develop a new side hustle', type: 'task', completed: true },
  { id: 'task-4', keyPrkId: 'key-3', title: 'Go to the gym 3x a week', type: 'habit', completed: false },
  { id: 'task-5', keyPrkId: 'key-3', title: 'Meal prep for the week', type: 'habit', completed: true },
  { id: 'task-6', keyPrkId: 'key-4', title: 'Read 30 minutes before bed', type: 'habit', completed: false },
  { id: 'task-7', keyPrkId: 'key-4', title: 'Finish "The Psychology of Money"', type: 'task', completed: false },
];

export const getInitialData = () => ({
  lifePrks,
  keyPrks,
  habitTasks,
});
