import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { getFieldError, parseApiError } from '../../../shared/utils/http-error.util';

@Component({
  selector: 'bc-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    role: ['patient' as 'patient' | 'doctor'],
  });

  onSubmit(): void {
    this.serverError.set('');
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.signup(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Account created successfully!');
        void this.router.navigateByUrl(this.auth.getDashboardRoute());
      },
      error: (err: HttpErrorResponse) => {
        const parsed = parseApiError(err, 'signup');
        this.serverError.set(parsed.message);
        this.fieldErrors.set(parsed.fieldErrors);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  onGoogleSignIn(): void {
    this.toast.success('Google authentication is coming soon!');
  }

  fieldError(field: 'name' | 'email' | 'password' | 'phone'): string | undefined {
    const control = this.form.get(field);
    let validation: string | undefined;

    if (field === 'name') {
      validation = control?.hasError('required')
        ? 'Full name is required'
        : control?.hasError('minlength')
          ? 'Name must be at least 3 characters'
          : undefined;
    } else if (field === 'email') {
      validation = control?.hasError('required')
        ? 'Email is required'
        : control?.hasError('email')
          ? 'Please enter a valid email address'
          : undefined;
    } else if (field === 'password') {
      validation = control?.hasError('required')
        ? 'Password is required'
        : control?.hasError('minlength')
          ? 'Password must be at least 6 characters'
          : undefined;
    } else if (field === 'phone') {
      validation = control?.hasError('required') ? 'Phone number is required' : undefined;
    }

    return getFieldError(this.fieldErrors(), field, !!control?.touched, validation);
  }
}
