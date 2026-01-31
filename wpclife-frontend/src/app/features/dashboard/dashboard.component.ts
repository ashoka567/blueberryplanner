import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Chore } from '../../shared/models/chore.model';
import { CalendarEvent } from '../../shared/models/calendar.model';
import { Medication } from '../../shared/models/medication.model';
import { GroceryItem } from '../../shared/models/grocery.model';
import { environment } from '../../../environments/environment';

interface ParsedItem {
  type: string;
  title: string;
}

interface ScheduleResponse {
  message: string;
  items: ParsedItem[];
  choresCreated: number;
  remindersCreated: number;
  medicationsCreated: number;
  groceriesCreated: number;
}

interface MedicineLog {
  id: string;
  medicineId: string;
  scheduledTime: string;
  takenAt: string;
  status: string;
}

interface DoseInfo {
  time: string;
  taken: boolean;
}

interface ScheduleItem {
  id: string;
  type: 'reminder' | 'chore' | 'medication';
  title: string;
  time?: string;
  status?: string;
  assignedTo?: string;
  assignedName?: string;
  medicineId?: string;
  doses?: DoseInfo[];
}

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
}

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Blueberry</h1>
        </header>
        <div class="welcome-section">
          <h2>Welcome back, {{ userName }}</h2>
          <p>Here's what's happening with your family today</p>
        </div>
        
        <div class="dashboard-grid-top">
          <section class="card quick-actions-card" data-testid="card-quick-actions">
            <div class="quick-actions-header" (click)="quickActionsOpen = !quickActionsOpen" data-testid="button-toggle-quick-actions">
              <h3>Quick Actions</h3>
              <span class="toggle-icon" [class.open]="quickActionsOpen">+</span>
            </div>
            @if (quickActionsOpen) {
              <div class="quick-actions-content">
                <div class="quick-actions-grid">
                  <button class="quick-action-btn" routerLink="/calendar" data-testid="button-add-reminder">
                    <span class="icon">+</span> Reminder
                  </button>
                  <button class="quick-action-btn" routerLink="/medications" data-testid="button-log-meds">
                    <span class="icon">💊</span> Meds
                  </button>
                  <button class="quick-action-btn" routerLink="/chores" data-testid="button-add-chore">
                    <span class="icon">✓</span> Chore
                  </button>
                  <button class="quick-action-btn" routerLink="/groceries" data-testid="button-add-grocery">
                    <span class="icon">🛒</span> Grocery
                  </button>
                </div>
                <ul class="quick-stats">
                  <li><span class="dot"></span> {{ medications.length }} medication(s) being tracked</li>
                  <li><span class="dot"></span> {{ todayReminders.length }} upcoming reminder(s)</li>
                </ul>
              </div>
            }
          </section>
          
          <section class="card todays-schedule-card" data-testid="card-todays-schedule">
            <div class="schedule-header">
              <h3>Today's Schedule</h3>
              <button class="view-all-btn" (click)="showAllSchedule = !showAllSchedule" data-testid="button-view-all-schedule">
                {{ showAllSchedule ? 'Show Less' : 'View All (' + todayChores.length + ' chores)' }}
              </button>
            </div>
            @if (isLoading) {
              <div class="loading-state">Loading...</div>
            } @else if (displaySchedule.length === 0) {
              <p class="empty-state">No appointments or medications for today</p>
            } @else {
              <div class="schedule-list">
                @for (item of displaySchedule; track item.id) {
                  <div class="schedule-item" [attr.data-testid]="'card-schedule-' + item.type + '-' + item.id">
                    <div class="schedule-icon" [class]="'icon-' + item.type + '-' + (item.status || 'pending').toLowerCase()">
                      @if (item.type === 'reminder') { 📅 }
                      @else if (item.type === 'chore' && item.status === 'PENDING') { ⏰ }
                      @else if (item.type === 'chore') { ✓ }
                      @else if (item.type === 'medication' && item.status === 'TAKEN') { ✓ }
                      @else { 💊 }
                    </div>
                    <div class="schedule-details">
                      <h4>{{ item.title }}</h4>
                      <p class="schedule-meta">
                        @if (item.time) {
                          <span class="time">🕐 {{ item.time }}</span>
                        }
                        @if (item.type === 'medication' && item.doses && item.doses.length > 0) {
                          <span class="doses">
                            @for (dose of item.doses; track dose.time) {
                              <button 
                                class="dose-btn" 
                                [class.taken]="dose.taken"
                                (click)="handleDoseClick(item.medicineId!, dose.time, dose.taken, $event)"
                                [attr.data-testid]="'button-dose-' + item.id + '-' + dose.time"
                              >
                                {{ dose.time }} {{ dose.taken ? '✓' : '○' }}
                              </button>
                            }
                          </span>
                        }
                        @if (item.type === 'chore') {
                          <span class="chore-info">
                            <span class="assigned-name">{{ item.assignedName || 'Unassigned' }}</span>
                            <span class="status">• {{ (item.status || 'pending').toLowerCase() }}</span>
                          </span>
                        }
                      </p>
                    </div>
                    <span class="schedule-badge" [class]="'badge-' + item.type + '-' + (item.status || 'pending').toLowerCase()">
                      @if (item.type === 'medication') {
                        {{ item.status === 'TAKEN' ? 'All Taken' : item.status === 'PARTIAL' ? 'Partial' : 'Pending' }}
                      } @else {
                        {{ item.type }}
                      }
                    </span>
                  </div>
                }
              </div>
            }
          </section>
        </div>
        
        @if (isGuardian) {
          <section class="smart-input-section" data-testid="section-smart-input">
            <div class="smart-input-card">
              <h3>✨ Quick Add with AI</h3>
              <p class="hint">Type or speak to add chores, reminders, medications, or groceries</p>
              
              <div class="input-container">
                <textarea
                  [(ngModel)]="smartInputText"
                  placeholder="Try: 'Tomorrow buy milk and eggs, remind me to take vitamins at 8am, kids need to do homework by 5pm, doctor appointment Thursday at 2pm'"
                  rows="3"
                  [disabled]="isProcessing"
                  data-testid="input-smart-text"
                ></textarea>
                
                <div class="input-actions">
                  <button 
                    class="voice-btn" 
                    (click)="toggleVoiceInput()"
                    [class.recording]="isRecording"
                    [disabled]="isProcessing || !speechSupported"
                    [title]="speechSupported ? (isRecording ? 'Stop recording' : 'Start voice input') : 'Voice input not supported in this browser'"
                    data-testid="button-voice-input"
                  >
                    {{ isRecording ? '🔴 Stop' : '🎤 Speak' }}
                  </button>
                  
                  <button 
                    class="send-btn" 
                    (click)="processSmartInput()"
                    [disabled]="isProcessing || !smartInputText.trim()"
                    data-testid="button-process-input"
                  >
                    {{ isProcessing ? 'Processing...' : 'Add Items' }}
                  </button>
                </div>
              </div>
              
              @if (lastResult) {
                <div class="result-message" [class.success]="lastResult.success" data-testid="text-result-message">
                  <span>{{ lastResult.message }}</span>
                  @if (lastResult.items && lastResult.items.length > 0) {
                    <div class="created-items">
                      @for (item of lastResult.items; track item.title) {
                        <span class="item-badge" [class]="item.type">{{ item.type }}: {{ item.title }}</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </section>
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
    
    .welcome-section {
      margin-bottom: 1.5rem;
      
      h2 {
        margin-bottom: 0.25rem;
      }
      
      p {
        color: var(--text-secondary);
      }
    }
    
    .dashboard-grid-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }
    
    .quick-actions-card {
      background: linear-gradient(135deg, #D2691E 0%, #E8A060 100%);
      color: white;
      padding: 0;
      overflow: hidden;
    }
    
    .quick-actions-header {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      position: relative;
      
      h3 {
        margin: 0;
        font-size: 1.125rem;
      }
      
      .toggle-icon {
        position: absolute;
        right: 1.5rem;
        font-size: 1.25rem;
        transition: transform 0.2s;
        
        &.open {
          transform: rotate(45deg);
        }
      }
    }
    
    .quick-actions-content {
      padding: 0.5rem 1.5rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .quick-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    
    .quick-action-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .icon {
        font-size: 0.875rem;
      }
    }
    
    .quick-stats {
      list-style: none;
      padding: 0;
      margin: 1rem 0 0;
      font-size: 0.75rem;
      opacity: 0.9;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 1rem;
      
      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      .dot {
        width: 0.375rem;
        height: 0.375rem;
        border-radius: 50%;
        background: white;
        box-shadow: 0 0 8px white;
      }
    }
    
    .todays-schedule-card {
      background: rgba(255,255,255,0.5);
      backdrop-filter: blur(10px);
      padding: 0;
      overflow: hidden;
    }
    
    .schedule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(210, 105, 30, 0.05);
      
      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: #D2691E;
      }
    }
    
    .view-all-btn {
      background: none;
      border: none;
      color: #D2691E;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      
      &:hover {
        background: rgba(210, 105, 30, 0.1);
      }
    }
    
    .loading-state {
      padding: 2rem;
      text-align: center;
      color: #D2691E;
    }
    
    .empty-state {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .schedule-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .schedule-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(0,0,0,0.02);
      }
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .schedule-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      
      &.icon-reminder-pending { background: rgba(210, 105, 30, 0.1); }
      &.icon-chore-pending { background: #fef3c7; }
      &.icon-chore-completed { background: #dcfce7; }
      &.icon-medication-taken { background: #dcfce7; }
      &.icon-medication-partial { background: #fef3c7; }
      &.icon-medication-pending { background: #fce7f3; }
    }
    
    .schedule-details {
      flex: 1;
      min-width: 0;
      
      h4 {
        margin: 0 0 0.25rem;
        font-size: 0.875rem;
        font-weight: 600;
      }
    }
    
    .schedule-meta {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .doses {
      display: flex;
      gap: 0.5rem;
    }
    
    .dose-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      background: #fce7f3;
      color: #be185d;
      
      &:hover:not(.taken) {
        background: #fbcfe8;
      }
      
      &.taken {
        background: #dcfce7;
        color: #166534;
        cursor: default;
      }
    }
    
    .chore-info {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .assigned-name {
      font-weight: 500;
      color: #D2691E;
    }
    
    .status {
      text-transform: capitalize;
    }
    
    .schedule-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: capitalize;
      
      &.badge-reminder-pending { background: rgba(210, 105, 30, 0.1); color: #D2691E; }
      &.badge-chore-pending { background: #fef3c7; color: #92400e; }
      &.badge-chore-completed { background: #dcfce7; color: #166534; }
      &.badge-medication-taken { background: #dcfce7; color: #166534; }
      &.badge-medication-partial { background: #fef3c7; color: #92400e; }
      &.badge-medication-pending { background: #fce7f3; color: #be185d; }
    }
    
    .smart-input-section {
      margin-top: 1.5rem;
    }
    
    .smart-input-card {
      background: linear-gradient(135deg, #D2691E 0%, #B8581A 100%);
      border-radius: 1rem;
      padding: 1.5rem;
      color: white;
      box-shadow: 0 10px 40px rgba(210, 105, 30, 0.3);
      
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1.25rem;
      }
      
      .hint {
        opacity: 0.8;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
    }
    
    .input-container {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      
      textarea {
        width: 100%;
        border: none;
        resize: none;
        font-family: inherit;
        font-size: 0.9rem;
        color: #333;
        
        &:focus {
          outline: none;
        }
        
        &::placeholder {
          color: #9ca3af;
        }
      }
    }
    
    .input-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
      justify-content: flex-end;
    }
    
    .voice-btn, .send-btn {
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .voice-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      color: #374151;
      
      &:hover:not(:disabled) {
        background: #e5e7eb;
      }
      
      &.recording {
        background: #fef2f2;
        border-color: #ef4444;
        color: #dc2626;
        animation: pulse 1.5s infinite;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .send-btn {
      background: #D2691E;
      border: none;
      color: white;
      
      &:hover:not(:disabled) {
        background: #B8581A;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .result-message {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: rgba(255,255,255,0.2);
      font-size: 0.875rem;
      
      &.success {
        background: rgba(34, 197, 94, 0.2);
      }
    }
    
    .created-items {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .item-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      background: rgba(255,255,255,0.3);
      
      &.chore { background: #fef3c7; color: #92400e; }
      &.reminder { background: #dbeafe; color: #1e40af; }
      &.medication { background: #dcfce7; color: #166534; }
      &.grocery { background: #e0e7ff; color: #4338ca; }
    }
    
    @media (max-width: 1024px) {
      .main-content {
        margin-left: 0;
      }
      
      .dashboard-grid-top {
        grid-template-columns: 1fr;
      }
    }
    
    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  userName = 'User';
  isGuardian = false;
  quickActionsOpen = false;
  showAllSchedule = false;
  isLoading = true;
  
  todayReminders: any[] = [];
  todayChores: Chore[] = [];
  pendingChores: Chore[] = [];
  medications: Medication[] = [];
  medicineLogs: MedicineLog[] = [];
  members: FamilyMember[] = [];
  groceryItems: GroceryItem[] = [];
  pendingGroceries = 0;
  leaderboardEntries: { userId: string; userName: string; points: number }[] = [];
  
  displaySchedule: ScheduleItem[] = [];
  
  smartInputText = '';
  isProcessing = false;
  isRecording = false;
  speechSupported = false;
  lastResult: { success: boolean; message: string; items?: ParsedItem[] } | null = null;
  
  private recognition: any;
  private familyId: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSpeechSupport();
    this.loadUserData();
  }

  private checkSpeechSupport(): void {
    this.speechSupported = 'webkitSpeechRecognition' in window;
    if (this.speechSupported) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        this.smartInputText = transcript;
      };
      
      this.recognition.onerror = () => {
        this.isRecording = false;
      };
      
      this.recognition.onend = () => {
        this.isRecording = false;
      };
    }
  }

  private loadUserData(): void {
    this.http.get<any>(`${environment.apiUrl}/api/auth/me`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.authenticated && response.user) {
            this.userName = response.user.name || 'User';
            this.isGuardian = !response.user.isChild;
            this.familyId = response.familyId;
            this.loadDashboardData();
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private loadDashboardData(): void {
    if (!this.familyId) {
      this.isLoading = false;
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.http.get<FamilyMember[]>(`${environment.apiUrl}/api/families/${this.familyId}/members`, { withCredentials: true })
      .subscribe(members => this.members = members || []);

    this.http.get<any[]>(`${environment.apiUrl}/api/families/${this.familyId}/reminders`, { withCredentials: true })
      .subscribe({
        next: (reminders) => {
          this.todayReminders = (reminders || []).filter(r => {
            if (!r.startTime) return false;
            const reminderDate = new Date(r.startTime);
            return reminderDate >= today && reminderDate < tomorrow;
          });
          this.buildSchedule();
        }
      });

    this.http.get<Chore[]>(`${environment.apiUrl}/api/families/${this.familyId}/chores`, { withCredentials: true })
      .subscribe({
        next: (chores) => {
          this.pendingChores = (chores || []).filter(c => c.status === 'PENDING');
          this.todayChores = (chores || []).filter(c => c.dueDate === todayStr);
          this.calculateLeaderboard(chores || []);
          this.buildSchedule();
        }
      });

    this.http.get<Medication[]>(`${environment.apiUrl}/api/families/${this.familyId}/medicines`, { withCredentials: true })
      .subscribe({
        next: (meds) => {
          this.medications = meds || [];
          this.buildSchedule();
        }
      });

    this.http.get<MedicineLog[]>(`${environment.apiUrl}/api/families/${this.familyId}/medicine-logs`, { withCredentials: true })
      .subscribe({
        next: (logs) => {
          this.medicineLogs = logs || [];
          this.buildSchedule();
        }
      });

    this.http.get<GroceryItem[]>(`${environment.apiUrl}/api/families/${this.familyId}/groceries`, { withCredentials: true })
      .subscribe({
        next: (items) => {
          this.groceryItems = items || [];
          this.pendingGroceries = this.groceryItems.filter(i => !i.purchased).length;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private buildSchedule(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const reminderItems: ScheduleItem[] = this.todayReminders.map(r => ({
      id: r.id,
      type: 'reminder' as const,
      title: r.title,
      time: r.startTime ? new Date(r.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : undefined,
      status: 'PENDING'
    }));

    const medicationItems: ScheduleItem[] = this.medications
      .filter(m => this.isMedicationActiveToday(m))
      .map(m => {
        const schedule = m.schedule as { type?: string; times?: string[] } | null;
        const times = schedule?.times || [];
        const dosesInfo = times.map(time => ({
          time,
          taken: this.isDoseTakenToday(m.id, time)
        }));
        const allTaken = dosesInfo.every(d => d.taken);
        const someTaken = dosesInfo.some(d => d.taken);
        return {
          id: m.id,
          type: 'medication' as const,
          title: m.name,
          medicineId: m.id,
          doses: dosesInfo,
          status: allTaken ? 'TAKEN' : (someTaken ? 'PARTIAL' : 'PENDING')
        };
      });

    const choreItems: ScheduleItem[] = this.todayChores.map(c => {
      const member = this.members.find(m => m.id === c.assignedTo);
      return {
        id: c.id,
        type: 'chore' as const,
        title: c.title,
        status: c.status || 'PENDING',
        assignedTo: c.assignedTo || undefined,
        assignedName: member?.name
      };
    });

    const priorityItems = [...reminderItems, ...medicationItems];
    this.displaySchedule = this.showAllSchedule ? [...priorityItems, ...choreItems] : priorityItems;
  }

  private isMedicationActiveToday(medicine: Medication): boolean {
    if (!medicine.active) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (medicine.startDate && todayStr < medicine.startDate) return false;
    if (medicine.endDate && todayStr > medicine.endDate) return false;
    return true;
  }

  private isDoseTakenToday(medicineId: string, scheduledTime: string): boolean {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return this.medicineLogs.some(log => {
      const logDate = new Date(log.takenAt);
      logDate.setHours(0, 0, 0, 0);
      return log.medicineId === medicineId && 
             log.scheduledTime === scheduledTime && 
             logDate.getTime() === todayStart.getTime();
    });
  }

  handleDoseClick(medicineId: string, scheduledTime: string, alreadyTaken: boolean, event: Event): void {
    event.stopPropagation();
    if (alreadyTaken || !this.familyId) return;

    this.http.post(`${environment.apiUrl}/api/families/${this.familyId}/medicine-logs`, {
      medicineId,
      takenAt: new Date().toISOString(),
      scheduledTime,
      status: 'TAKEN'
    }, { withCredentials: true }).subscribe({
      next: () => {
        this.loadDashboardData();
      }
    });
  }

  private calculateLeaderboard(chores: Chore[]): void {
    const pointsMap = new Map<string, { name: string; points: number }>();
    
    chores.filter(c => c.status === 'COMPLETED' && c.assignedTo).forEach(chore => {
      const current = pointsMap.get(chore.assignedTo!) || { name: '', points: 0 };
      const member = this.members.find(m => m.id === chore.assignedTo);
      current.name = member?.name || 'Unknown';
      current.points += chore.points || 0;
      pointsMap.set(chore.assignedTo!, current);
    });
    
    this.leaderboardEntries = Array.from(pointsMap.entries())
      .map(([userId, data]) => ({ userId, userName: data.name, points: data.points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  toggleVoiceInput(): void {
    if (this.isRecording) {
      this.recognition?.stop();
      this.isRecording = false;
    } else {
      this.smartInputText = '';
      this.recognition?.start();
      this.isRecording = true;
    }
  }

  processSmartInput(): void {
    if (!this.smartInputText.trim() || this.isProcessing) return;
    
    this.isProcessing = true;
    this.lastResult = null;
    
    this.http.post<ScheduleResponse>(`${environment.apiUrl}/api/ai/schedule`, {
      text: this.smartInputText,
      familyId: this.familyId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }, { withCredentials: true }).subscribe({
      next: (data) => {
        const totalCreated = (data.choresCreated || 0) + (data.remindersCreated || 0) + (data.medicationsCreated || 0) + (data.groceriesCreated || 0);
        
        this.lastResult = {
          success: totalCreated > 0,
          message: data.message,
          items: data.items
        };
        
        if (totalCreated > 0) {
          this.smartInputText = '';
          this.loadDashboardData();
        }
        
        this.isProcessing = false;
        
        setTimeout(() => {
          this.lastResult = null;
        }, 3000);
      },
      error: (error) => {
        this.lastResult = {
          success: false,
          message: 'Failed to process your request. Please try again.'
        };
        this.isProcessing = false;
      }
    });
  }
}
