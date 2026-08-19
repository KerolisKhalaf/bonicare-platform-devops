import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  selector: 'bc-not-found',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="not-found">
      <img src="/photos/404-error.png" alt="Page Not Found" class="not-found__img" />
      <h2>Page Not Found</h2>
      <p>We're sorry, the page you requested could not be found. Please check the URL or return to the application dashboard.</p>
      <bc-button routerLink="/">Go to Dashboard</bc-button>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
      background: var(--color-bg);
      box-sizing: border-box;

      &__img {
        max-width: 22rem;
        height: auto;
        margin-bottom: 2rem;
        object-fit: contain;
      }

      h2 {
        font-size: 2rem;
        color: var(--color-text);
        margin: 0 0 0.75rem 0;
        font-weight: 700;
      }

      p {
        font-size: 1rem;
        color: var(--color-text-muted);
        max-width: 28rem;
        margin: 0 0 2rem 0;
        line-height: 1.6;
      }
    }
  `]
})
export class NotFoundComponent {}
