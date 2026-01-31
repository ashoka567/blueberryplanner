import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ParsedItem {
  type: string;
  title: string;
  description: string;
  dateTime: string;
  points?: number;
}

interface ScheduleResponse {
  message: string;
  items: ParsedItem[];
  choresCreated: number;
  eventsCreated: number;
  medicationsCreated: number;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-assistant">
      <div class="header">
        <h1>AI Schedule Assistant</h1>
        <p>Tell me about your schedule in plain language, and I'll create chores, events, and medication reminders for you.</p>
      </div>
      
      <div class="chat-container">
        <div class="messages">
          <div *ngFor="let msg of messages" [class]="'message ' + msg.type">
            <div class="message-content">
              <p>{{ msg.text }}</p>
              <div *ngIf="msg.items && msg.items.length > 0" class="items-list">
                <div *ngFor="let item of msg.items" class="parsed-item">
                  <span class="item-type" [class]="item.type">{{ item.type }}</span>
                  <span class="item-title">{{ item.title }}</span>
                  <span *ngIf="item.points" class="item-points">{{ item.points }} pts</span>
                </div>
              </div>
              <div *ngIf="msg.summary" class="summary">
                <span *ngIf="msg.summary.choresCreated">{{ msg.summary.choresCreated }} chores</span>
                <span *ngIf="msg.summary.eventsCreated">{{ msg.summary.eventsCreated }} events</span>
                <span *ngIf="msg.summary.medicationsCreated">{{ msg.summary.medicationsCreated }} medications</span>
              </div>
            </div>
          </div>
          
          <div *ngIf="loading" class="message assistant">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <textarea 
            [(ngModel)]="inputText" 
            placeholder="Example: Tomorrow I need to clean my room, take my vitamins in the morning, and I have a dentist appointment at 3pm..."
            rows="3"
            (keydown.enter)="!$event.shiftKey && sendMessage(); $event.shiftKey || $event.preventDefault()"
            data-testid="input-schedule-text"
          ></textarea>
          <button 
            (click)="sendMessage()" 
            [disabled]="loading || !inputText.trim()"
            data-testid="button-send-schedule"
          >
            <span *ngIf="!loading">Send</span>
            <span *ngIf="loading">...</span>
          </button>
        </div>
      </div>
      
      <div class="examples">
        <h3>Try saying things like:</h3>
        <ul>
          <li>"Tomorrow I need to do laundry and vacuum the living room"</li>
          <li>"Schedule a family dinner on Saturday at 6pm"</li>
          <li>"Remind me to take my blood pressure medicine every morning and evening"</li>
          <li>"Next week: Monday - grocery shopping, Wednesday - soccer practice at 4pm, Friday - date night"</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .ai-assistant {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #D2691E;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
    }
    
    .chat-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .messages {
      padding: 20px;
      min-height: 300px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .message {
      margin-bottom: 16px;
      display: flex;
    }
    
    .message.user {
      justify-content: flex-end;
    }
    
    .message.user .message-content {
      background: #D2691E;
      color: white;
    }
    
    .message.assistant .message-content {
      background: #f3f4f6;
      color: #333;
    }
    
    .message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
    }
    
    .message-content p {
      margin: 0;
    }
    
    .items-list {
      margin-top: 12px;
    }
    
    .parsed-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(255,255,255,0.5);
      border-radius: 6px;
      margin-bottom: 6px;
    }
    
    .item-type {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .item-type.chore {
      background: #fef3c7;
      color: #92400e;
    }
    
    .item-type.event {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .item-type.medication {
      background: #dcfce7;
      color: #166534;
    }
    
    .item-title {
      flex: 1;
    }
    
    .item-points {
      font-size: 12px;
      color: #D2691E;
      font-weight: 600;
    }
    
    .summary {
      margin-top: 10px;
      display: flex;
      gap: 12px;
      font-size: 12px;
    }
    
    .summary span {
      padding: 4px 8px;
      background: rgba(210, 105, 30, 0.2);
      border-radius: 4px;
    }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    
    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    .input-area {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .input-area textarea {
      flex: 1;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      resize: none;
      font-family: inherit;
    }
    
    .input-area textarea:focus {
      outline: none;
      border-color: #D2691E;
    }
    
    .input-area button {
      padding: 12px 24px;
      background: #D2691E;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .input-area button:hover:not(:disabled) {
      background: #B8581A;
    }
    
    .input-area button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .examples {
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }
    
    .examples h3 {
      margin: 0 0 12px;
      color: #374151;
    }
    
    .examples ul {
      margin: 0;
      padding-left: 20px;
      color: #6b7280;
    }
    
    .examples li {
      margin-bottom: 8px;
    }
  `]
})
export class AiAssistantComponent {
  inputText = '';
  loading = false;
  messages: Array<{
    type: 'user' | 'assistant';
    text: string;
    items?: ParsedItem[];
    summary?: { choresCreated: number; eventsCreated: number; medicationsCreated: number };
  }> = [];

  constructor(private http: HttpClient) {}

  sendMessage() {
    if (!this.inputText.trim() || this.loading) return;

    const text = this.inputText.trim();
    this.messages.push({ type: 'user', text });
    this.inputText = '';
    this.loading = true;

    this.http.post<ScheduleResponse>(`${environment.apiUrl}/ai/schedule`, { text })
      .subscribe({
        next: (response) => {
          this.messages.push({
            type: 'assistant',
            text: response.message,
            items: response.items,
            summary: {
              choresCreated: response.choresCreated,
              eventsCreated: response.eventsCreated,
              medicationsCreated: response.medicationsCreated
            }
          });
          this.loading = false;
        },
        error: (err) => {
          this.messages.push({
            type: 'assistant',
            text: 'Sorry, something went wrong. Please try again.'
          });
          this.loading = false;
        }
      });
  }
}
