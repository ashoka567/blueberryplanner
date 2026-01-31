import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface NotificationSettings {
  medicationsEnabled: boolean;
  medicationsMinutes: number;
  choresEnabled: boolean;
  choresMinutes: number;
  remindersEnabled: boolean;
  remindersMinutes: number;
  groceriesEnabled: boolean;
  calendarEnabled: boolean;
  calendarMinutes: number;
  pushEnabled: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Blueberry</h1>
        </header>
        
        <div class="page-header">
          <h2>Notifications</h2>
          <p>Manage when and how you receive notifications</p>
        </div>
        
        @if (isLoading) {
          <div class="loading-state">Loading...</div>
        } @else {
          <section class="card">
            <div class="card-header">
              <h3>Categories</h3>
              <p class="card-subtitle">Items without a set time will notify at 8:00 AM</p>
            </div>
            <div class="card-content">
              <div class="category-row pink" data-testid="section-medications-notifications">
                <div class="category-icon">💊</div>
                <div class="category-info">
                  <label class="category-label">Medications</label>
                </div>
                <div class="category-controls">
                  <select 
                    [(ngModel)]="settings.medicationsMinutes"
                    [disabled]="!settings.medicationsEnabled"
                    (change)="saveSettings()"
                    class="timing-select"
                    data-testid="select-medications-timing"
                  >
                    @for (opt of timingOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.medicationsEnabled"
                      (change)="saveSettings()"
                      data-testid="switch-medications-enabled"
                    >
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="category-row amber" data-testid="section-chores-notifications">
                <div class="category-icon">✓</div>
                <div class="category-info">
                  <label class="category-label">Chores</label>
                </div>
                <div class="category-controls">
                  <select 
                    [(ngModel)]="settings.choresMinutes"
                    [disabled]="!settings.choresEnabled"
                    (change)="saveSettings()"
                    class="timing-select"
                    data-testid="select-chores-timing"
                  >
                    @for (opt of timingOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.choresEnabled"
                      (change)="saveSettings()"
                      data-testid="switch-chores-enabled"
                    >
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="category-row blue" data-testid="section-reminders-notifications">
                <div class="category-icon">⏰</div>
                <div class="category-info">
                  <label class="category-label">Reminders</label>
                </div>
                <div class="category-controls">
                  <select 
                    [(ngModel)]="settings.remindersMinutes"
                    [disabled]="!settings.remindersEnabled"
                    (change)="saveSettings()"
                    class="timing-select"
                    data-testid="select-reminders-timing"
                  >
                    @for (opt of timingOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.remindersEnabled"
                      (change)="saveSettings()"
                      data-testid="switch-reminders-enabled"
                    >
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              </div>
          </section>
        }
        
        @if (isSaving) {
          <div class="saving-indicator">Saving...</div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
      margin-left: 250px;
      padding: 2rem;
      background: var(--background);
    }
    
    .mobile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: white;
      border-bottom: 1px solid var(--border);
      margin: -2rem -2rem 1.5rem -2rem;
      
      h1 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--primary);
        margin: 0;
      }
    }
    
    .page-header {
      margin-bottom: 1rem;
      
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #D2691E;
        margin: 0 0 0.25rem;
      }
      
      p {
        color: var(--text-secondary);
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #D2691E;
    }
    
    .card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      margin-bottom: 1rem;
      overflow: hidden;
    }
    
    .push-card {
      .card-header-gradient {
        background: linear-gradient(135deg, #D2691E 0%, #E8A060 100%);
        padding: 1.5rem;
        color: white;
        
        h3 {
          margin: 0 0 0.25rem;
          font-size: 1.125rem;
        }
        
        p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.875rem;
        }
      }
    }
    
    .card-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      
      h3 {
        margin: 0;
        font-size: 1rem;
        color: #D2691E;
      }
      
      .card-subtitle {
        margin: 0.25rem 0 0;
        color: var(--text-secondary);
        font-size: 0.75rem;
      }
    }
    
    .card-content {
      padding: 1rem;
    }
    
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .setting-label {
      font-weight: 500;
      font-size: 1rem;
    }
    
    .setting-desc {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #D2691E;
      color: white;
      border: none;
      
      &:hover:not(:disabled) {
        background: #B8581A;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .btn-outline-danger {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      
      &:hover {
        background: #fef2f2;
      }
    }
    
    .category-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &.pink { background: #fce7f3; }
      &.amber { background: #fef3c7; }
      &.blue { background: #dbeafe; }
      &.purple { background: #f3e8ff; }
      &.green { background: #dcfce7; }
    }
    
    .category-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      background: rgba(255,255,255,0.7);
    }
    
    .category-info {
      flex: 1;
    }
    
    .category-label {
      font-weight: 500;
      font-size: 0.875rem;
      display: block;
    }
    
    .category-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .timing-select {
      padding: 0.375rem;
      border-radius: 0.375rem;
      border: 1px solid var(--border);
      background: white;
      font-size: 0.75rem;
      min-width: 80px;
      position: relative;
      z-index: 50;
      
      &:disabled {
        opacity: 0.5;
      }
    }
    
    .toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      
      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #f87171;
        transition: 0.3s;
        border-radius: 26px;
        
        &:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
      }
      
      input:checked + .slider {
        background-color: #22c55e;
      }
      
      input:checked + .slider:before {
        transform: translateX(22px);
      }
    }
    
    .saving-indicator {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: #D2691E;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 20px rgba(210, 105, 30, 0.3);
    }
    
    @media (max-width: 1024px) {
      .main-content {
        margin-left: 0;
      }
    }
    
    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }
      
      .category-row {
        flex-wrap: wrap;
      }
      
      .category-controls {
        width: 100%;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  pushPermission: NotificationPermission = 'default';
  
  timingOptions = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hr' },
    { value: 120, label: '2 hr' },
  ];
  
  settings: NotificationSettings = {
    medicationsEnabled: true,
    medicationsMinutes: 15,
    choresEnabled: true,
    choresMinutes: 30,
    remindersEnabled: true,
    remindersMinutes: 15,
    groceriesEnabled: false,
    calendarEnabled: true,
    calendarMinutes: 15,
    pushEnabled: false,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSettings();
    this.checkNotificationPermission();
  }

  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.pushPermission = Notification.permission;
    }
  }

  private loadSettings(): void {
    this.http.get<NotificationSettings>(`${environment.apiUrl}/api/notification-settings`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.settings = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  saveSettings(): void {
    this.isSaving = true;
    this.http.post(`${environment.apiUrl}/api/notification-settings`, this.settings, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isSaving = false;
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  async requestPushPermission(): Promise<void> {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      this.pushPermission = permission;
      
      if (permission === 'granted') {
        this.settings.pushEnabled = true;
        this.saveSettings();
        new Notification('Blueberry Planner', {
          body: 'Push notifications are now enabled!',
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }

  disablePushNotifications(): void {
    this.settings.pushEnabled = false;
    this.saveSettings();
  }
}
