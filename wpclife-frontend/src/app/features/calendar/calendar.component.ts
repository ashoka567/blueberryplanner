import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CalendarEvent, CreateEventRequest } from '../../shared/models/calendar.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Calendar</h1>
          <button class="btn btn-close" routerLink="/dashboard">Close</button>
        </header>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="showModal = true">Add Event</button>
        </div>
        
        <div class="calendar-container">
          <div class="calendar-header">
            <button class="btn btn-secondary" (click)="previousMonth()">&lt;</button>
            <h2>{{ currentMonthName }} {{ currentYear }}</h2>
            <button class="btn btn-secondary" (click)="nextMonth()">&gt;</button>
          </div>
          
          <div class="calendar-grid">
            <div class="day-header">Sun</div>
            <div class="day-header">Mon</div>
            <div class="day-header">Tue</div>
            <div class="day-header">Wed</div>
            <div class="day-header">Thu</div>
            <div class="day-header">Fri</div>
            <div class="day-header">Sat</div>
            
            @for (day of calendarDays; track $index) {
              <div 
                class="calendar-day"
                [class.other-month]="day.otherMonth"
                [class.today]="day.isToday"
                (click)="selectDate(day.date)"
              >
                <span class="day-number">{{ day.day }}</span>
                @for (event of getEventsForDay(day.date); track event.id) {
                  <div class="event-chip" [class]="'type-' + event.type.toLowerCase()">
                    {{ event.title }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
        
        @if (showModal) {
          <div class="modal-overlay" (click)="showModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>{{ editingEvent ? 'Edit Event' : 'Add Event' }}</h3>
              
              <div class="form-group">
                <label>Title</label>
                <input type="text" [(ngModel)]="eventForm.title">
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="eventForm.description"></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Start</label>
                  <input type="datetime-local" [(ngModel)]="eventForm.startTime">
                </div>
                <div class="form-group">
                  <label>End</label>
                  <input type="datetime-local" [(ngModel)]="eventForm.endTime">
                </div>
              </div>
              
              <div class="form-group">
                <label>Type</label>
                <select [(ngModel)]="eventForm.type">
                  <option value="FAMILY">Family</option>
                  <option value="SCHOOL">School</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button class="btn btn-primary" (click)="saveEvent()">Save</button>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 250px; padding: 2rem; background: var(--background); }
    
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
      
      .btn-close {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        background: transparent;
        border: 1px solid var(--primary);
        color: var(--primary);
        border-radius: 0.375rem;
        
        &:hover {
          background: rgba(210, 105, 30, 0.1);
        }
      }
    }
    
    .page-actions { 
      display: flex; 
      justify-content: flex-end; 
      margin-bottom: 1.5rem; 
    }
    
    .calendar-container {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h2 { margin: 0; }
    }
    
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--border);
    }
    
    .day-header {
      background: var(--background);
      padding: 0.75rem;
      text-align: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .calendar-day {
      background: white;
      min-height: 100px;
      padding: 0.5rem;
      cursor: pointer;
      
      &:hover { background: var(--background); }
      &.other-month { color: var(--text-secondary); }
      &.today { background: #e0e7ff; }
      
      .day-number {
        font-weight: 500;
        display: block;
        margin-bottom: 0.25rem;
      }
    }
    
    .event-chip {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      &.type-family { background: #dbeafe; color: #1e40af; }
      &.type-school { background: #fef3c7; color: #92400e; }
      &.type-medical { background: #fee2e2; color: #991b1b; }
      &.type-other { background: #e5e7eb; color: #374151; }
    }
    
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    
    .modal {
      background: white;
      padding: 2rem;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 500px;
      
      h3 { margin: 0 0 1.5rem; }
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  `]
})
export class CalendarComponent implements OnInit {
  events: CalendarEvent[] = [];
  calendarDays: { day: number; date: Date; otherMonth: boolean; isToday: boolean }[] = [];
  currentDate = new Date();
  showModal = false;
  editingEvent: CalendarEvent | null = null;
  
  eventForm: CreateEventRequest = {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'OTHER',
    participantIds: []
  };

  constructor(private apiService: ApiService) {}

  get currentMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  ngOnInit(): void {
    this.loadEvents();
    this.generateCalendarDays();
  }

  loadEvents(): void {
    this.apiService.getEvents().subscribe(events => {
      this.events = events;
    });
  }

  generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    
    this.calendarDays = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      const date = new Date(year, month, -firstDay.getDay() + i + 1);
      this.calendarDays.push({
        day: date.getDate(),
        date,
        otherMonth: true,
        isToday: false
      });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        day: i,
        date,
        otherMonth: false,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    const remaining = 42 - this.calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        day: i,
        date,
        otherMonth: true,
        isToday: false
      });
    }
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  selectDate(date: Date): void {
    const dateStr = date.toISOString().slice(0, 16);
    this.eventForm = {
      title: '',
      description: '',
      startTime: dateStr,
      endTime: dateStr,
      type: 'OTHER',
      participantIds: []
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEvent = null;
  }

  saveEvent(): void {
    if (!this.eventForm.title) return;

    this.apiService.createEvent(this.eventForm).subscribe(() => {
      this.loadEvents();
      this.closeModal();
    });
  }
}
