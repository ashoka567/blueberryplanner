import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Welcome to WPCLife</h1>
        <p class="subtitle">Sign in to manage your family</p>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            >
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
              <span class="error-message">Valid email is required</span>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            >
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <span class="error-message">Password is required</span>
            }
          </div>
          
          @if (error) {
            <div class="error-banner">{{ error }}</div>
          }
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        
        <p class="auth-link">
          Don't have an account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      width: 100%;
      max-width: 400px;
      
      h1 {
        margin-bottom: 0.5rem;
        text-align: center;
      }
      
      .subtitle {
        color: var(--text-secondary);
        text-align: center;
        margin-bottom: 2rem;
      }
    }
    
    .btn-block {
      width: 100%;
      margin-top: 1rem;
    }
    
    .error-banner {
      background: #fee2e2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    
    .auth-link {
      text-align: center;
      margin-top: 1.5rem;
      color: var(--text-secondary);
      
      a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password';
        this.loading = false;
      }
    });
  }
}
