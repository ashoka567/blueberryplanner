import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'medications',
    loadComponent: () => import('./features/medications/medications.component').then(m => m.MedicationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chores',
    loadComponent: () => import('./features/chores/chores.component').then(m => m.ChoresComponent),
    canActivate: [authGuard]
  },
  {
    path: 'groceries',
    loadComponent: () => import('./features/groceries/groceries.component').then(m => m.GroceriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
