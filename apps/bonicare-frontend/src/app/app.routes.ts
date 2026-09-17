import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'patient', pathMatch: 'full' },
      {
        path: 'patient',
        children: [
          {
            path: 'medical-files',
            canActivate: [roleGuard('patient')],
            loadComponent: () =>
              import('./features/medical-files/medical-files.component').then((m) => m.MedicalFilesComponent),
          },
          {
            path: '',
            canActivate: [roleGuard('patient')],
            loadComponent: () =>
              import('./features/patient/patient-dashboard/patient-dashboard.component').then(
                (m) => m.PatientDashboardComponent
              ),
          },
        ],
      },
      {
        path: 'doctor',
        loadChildren: () => import('./features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENT_ROUTES),
      },
      {
        path: 'medical-files',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/medical-files/medical-files.component').then((m) => m.MedicalFilesComponent),
      },
      {
        path: 'ai',
        loadChildren: () => import('./features/ai/ai.routes').then((m) => m.AI_ROUTES),
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATION_ROUTES),
      },
      {
        path: 'video-consultation',
        loadChildren: () =>
          import('./features/video-consultation/video-consultation.routes').then((m) => m.VIDEO_ROUTES),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  { path: '**', redirectTo: '404' },
];
