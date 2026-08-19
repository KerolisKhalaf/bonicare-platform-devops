import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'bc-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__panel">
        <div class="auth-layout__brand">
          <img src="/images/boniecare logo.png" class="auth-layout__logo-img" alt="BoniCare Logo" />
          <h1>BoniCare</h1>
          <p>Professional healthcare platform connecting patients and doctors.</p>
        </div>
      </div>
      <div class="auth-layout__form">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }
    .auth-layout__panel {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(20, 184, 166, 0.9) 100%), url('/images/spine%20background.png');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #fff;
    }
    .auth-layout__brand {
      max-width: 24rem;
      text-align: center;
    }
    .auth-layout__logo-img {
      height: 5rem;
      object-fit: contain;
      margin-bottom: 1.5rem;
    }
    .auth-layout__brand h1 { margin: 0 0 0.75rem; font-size: 2.5rem; font-weight: 700; }
    .auth-layout__brand p { margin: 0; opacity: 0.9; line-height: 1.6; font-size: 1rem; }
    .auth-layout__form {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--color-bg);
    }
    @media (max-width: 768px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-layout__panel { display: none; }
    }
  `],
})
export class AuthLayoutComponent {}
