import { User, Medication, Chore, GroceryItem, CalendarEvent } from './types';
import { addHours, startOfToday, addDays, subDays } from 'date-fns';

export const USERS: User[] = [
  { id: 'u1', name: 'Sarah', role: 'GUARDIAN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u2', name: 'Mike', role: 'GUARDIAN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
  { id: 'u3', name: 'Leo', role: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  { id: 'u4', name: 'Mia', role: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
];

export const MEDICATIONS: Medication[] = [
  {
    id: 'm1',
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Daily',
    timeOfDay: ['08:00', '20:00'],
    assignedTo: 'u3',
    takenHistory: {
      [new Date().toISOString().split('T')[0]]: true,
    },
    inventory: 14,
  },
  {
    id: 'm2',
    name: 'Vitamin D',
    dosage: '1000IU',
    frequency: 'Daily',
    timeOfDay: ['09:00'],
    assignedTo: 'u1',
    takenHistory: {},
    inventory: 45,
  }
];

export const CHORES: Chore[] = [
  { id: 'c1', title: 'Empty Dishwasher', assignedTo: 'u3', dueDate: new Date().toISOString(), completed: false, points: 5 },
  { id: 'c2', title: 'Walk the Dog', assignedTo: 'u4', dueDate: new Date().toISOString(), completed: true, points: 10 },
  { id: 'c3', title: 'Take out Trash', assignedTo: 'u2', dueDate: new Date().toISOString(), completed: false, points: 5 },
];

export const GROCERIES: GroceryItem[] = [
  { id: 'g1', name: 'Milk', category: 'Dairy', addedBy: 'u1', checked: false },
  { id: 'g2', name: 'Bananas', category: 'Produce', addedBy: 'u3', checked: true },
  { id: 'g3', name: 'Cereal', category: 'Pantry', addedBy: 'u2', checked: false },
  { id: 'g4', name: 'Chicken Breast', category: 'Meat', addedBy: 'u1', checked: false },
];

const today = startOfToday();

export const EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Soccer Practice',
    start: addHours(today, 16),
    end: addHours(today, 17.5),
    type: 'School',
  },
  {
    id: 'e2',
    title: 'Dentist Appointment',
    start: addHours(addDays(today, 1), 10),
    end: addHours(addDays(today, 1), 11),
    type: 'Medical',
  },
  {
    id: 'e3',
    title: 'Family Movie Night',
    start: addHours(addDays(today, 2), 19),
    end: addHours(addDays(today, 2), 22),
    type: 'Family',
  }
];
