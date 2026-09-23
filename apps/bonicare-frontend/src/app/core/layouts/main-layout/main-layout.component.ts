import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { SocketService } from '../../services/socket.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

interface NavItem {
  label: string;
  path: string;
  icon?: string;
  image?: string;
  roles: Array<'patient' | 'doctor' | 'admin'>;
}

@Component({
  selector: 'bc-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly socket = inject(SocketService);

  readonly user = this.auth.user;
  readonly themeMode = this.theme.mode;
  readonly sidebarOpen = computed(() => true);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/patient', image: '/images/Dashboard.png', roles: ['patient'] },
    { label: 'Appointments', path: '/appointments', image: '/images/Calender.png', roles: ['patient', 'doctor', 'admin'] },
    { label: 'Medical Files', path: '/patient/medical-files', image: '/photos/bone-icon.png', roles: ['patient'] },
    { label: 'AI Reports', path: '/ai', image: '/photos/stethoscope.png', roles: ['patient', 'doctor'] },
    { label: 'Payments', path: '/payments', image: '/photos/Card.png', roles: ['patient', 'doctor', 'admin'] },
    { label: 'Notifications', path: '/notifications', image: '/images/bell-btn.png', roles: ['patient', 'doctor', 'admin'] },
    { label: 'Video Call', path: '/video-consultation', image: '/images/video-btn.png', roles: ['patient', 'doctor'] },
    { label: 'Dashboard', path: '/doctor', image: '/images/Dashboard.png', roles: ['doctor'] },
    { label: 'Profile', path: '/doctor/profile', image: '/images/Patients.png', roles: ['doctor'] },
    { label: 'Availability', path: '/doctor/availability', image: '/images/Calender.png', roles: ['doctor'] },
    { label: 'Admin', path: '/admin', image: '/images/Settings.png', roles: ['admin'] },
  ];

  readonly visibleNav = computed(() => {
    const role = this.auth.role();
    return this.navItems.filter((item) => role && item.roles.includes(role));
  });

  constructor() {
    this.socket.connect();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.socket.disconnect();
    this.auth.logout();
  }

  getUserAvatar(): string {
    const u = this.user();
    if (!u) return '/photos/admin.png';
    if (u.role === 'doctor') {
      if (u.name?.toLowerCase().includes('sara')) {
        return '/images/drsara.png';
      }
      return '/images/maledr.png';
    } else if (u.role === 'admin') {
      return '/photos/admin.png';
    } else {
      const charCodeSum = u.name?.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) ?? 0;
      const index = (charCodeSum % 4) + 1;
      if (index === 4) {
        return '/images/maleclient1.png';
      }
      return `/images/femaleclient${index}.png`;
    }
  }
}
