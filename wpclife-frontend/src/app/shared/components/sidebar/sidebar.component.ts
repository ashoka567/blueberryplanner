import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <h2>Blueberry</h2>
      </div>
      
      <nav class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active">
          <span class="icon">📊</span>
          Dashboard
        </a>
        <a routerLink="/calendar" routerLinkActive="active">
          <span class="icon">📅</span>
          Calendar
        </a>
        <a routerLink="/medications" routerLinkActive="active">
          <span class="icon">💊</span>
          Medications
        </a>
        <a routerLink="/chores" routerLinkActive="active">
          <span class="icon">✅</span>
          Chores
        </a>
        <a routerLink="/groceries" routerLinkActive="active">
          <span class="icon">🛒</span>
          Groceries
        </a>
        <a routerLink="/ai-assistant" routerLinkActive="active">
          <span class="icon">🤖</span>
          AI Assistant
        </a>
        <a routerLink="/notifications" routerLinkActive="active">
          <span class="icon">🔔</span>
          Notifications
        </a>
      </nav>
      
      <div class="user-section">
        <div class="user-info">
          <div class="avatar">{{ userInitial }}</div>
          <div class="details">
            <span class="name">{{ userName }}</span>
            <span class="role">{{ userRole }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: white;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
    }
    
    .logo {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      
      h2 {
        color: var(--primary);
        margin: 0;
      }
    }
    
    .nav-links {
      flex: 1;
      padding: 1rem 0;
      
      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.5rem;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.2s;
        
        &:hover {
          background: var(--background);
          color: var(--text-primary);
        }
        
        &.active {
          background: rgba(210, 105, 30, 0.1);
          color: var(--primary);
          border-right: 3px solid var(--primary);
        }
        
        .icon {
          font-size: 1.25rem;
        }
      }
    }
    
    .user-section {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }
      
      .details {
        display: flex;
        flex-direction: column;
        
        .name {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }
    
    .logout-btn {
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      
      &:hover {
        background: var(--background);
        color: var(--danger);
      }
    }
  `]
})
export class SidebarComponent {
  constructor(private authService: AuthService) {}

  get userName(): string {
    return this.authService.user()?.name || '';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  get userRole(): string {
    return this.authService.user()?.role || '';
  }

  logout(): void {
    this.authService.logout();
  }
}
