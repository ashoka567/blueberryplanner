import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Create Account</h1>
        <p class="subtitle">Start organizing your family today</p>
        
        <div class="tab-buttons">
          <button 
            [class.active]="!joinMode" 
            (click)="joinMode = false"
          >Create Household</button>
          <button 
            [class.active]="joinMode" 
            (click)="joinMode = true"
          >Join Household</button>
        </div>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" formControlName="name">
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" formControlName="password">
          </div>
          
          @if (!joinMode) {
            <div class="form-group">
              <label for="householdName">Household Name</label>
              <input type="text" id="householdName" formControlName="householdName" placeholder="e.g., The Smiths">
            </div>
          } @else {
            <div class="form-group">
              <label for="inviteCode">Invite Code</label>
              <input type="text" id="inviteCode" formControlName="inviteCode" placeholder="Enter invite code">
            </div>
          }
          
          @if (error) {
            <div class="error-banner">{{ error }}</div>
          }
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>
        
        <p class="auth-link">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
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
        margin-bottom: 1.5rem;
      }
    }
    
    .tab-buttons {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      
      button {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid var(--border);
        background: white;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        
        &.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
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
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  joinMode = false;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      householdName: [''],
      inviteCode: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';

    const data = {
      ...this.registerForm.value,
      role: this.joinMode ? 'MEMBER' : 'GUARDIAN'
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
