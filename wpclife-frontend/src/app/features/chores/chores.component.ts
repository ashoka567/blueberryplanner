import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Chore, CreateChoreRequest } from '../../shared/models/chore.model';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-chores',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Chores</h1>
          <button class="btn btn-close" routerLink="/dashboard">Close</button>
        </header>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="showModal = true">Add Chore</button>
        </div>
        
        <div class="content-grid">
          <section class="chores-section">
            <h2>Active Chores</h2>
            <div class="chores-list">
              @for (chore of pendingChores; track chore.id) {
                <div class="chore-card">
                  <div class="chore-info">
                    <h4>{{ chore.title }}</h4>
                    <p>{{ chore.description }}</p>
                    <div class="chore-meta">
                      <span class="assignee">{{ getMemberName(chore.assignedToId) }}</span>
                      <span class="due-date">Due: {{ formatDate(chore.dueDate) }}</span>
                    </div>
                  </div>
                  <div class="chore-points">
                    <span class="points">{{ chore.points }}</span>
                    <span class="label">pts</span>
                  </div>
                  <button class="btn btn-primary" (click)="completeChore(chore.id)">Complete</button>
                </div>
              }
              
              @if (pendingChores.length === 0) {
                <p class="empty-state">No pending chores. Great job!</p>
              }
            </div>
          </section>
          
          <aside class="leaderboard-section">
            <h2>Leaderboard</h2>
            <div class="leaderboard-card">
              @for (entry of leaderboard; track entry.userId; let i = $index) {
                <div class="leaderboard-item" [class.top-three]="i < 3">
                  <span class="rank">{{ i + 1 }}</span>
                  <span class="name">{{ entry.userName }}</span>
                  <span class="points">{{ entry.points }} pts</span>
                </div>
              }
              
              @if (leaderboard.length === 0) {
                <p class="empty-state">No points earned yet</p>
              }
            </div>
          </aside>
        </div>
        
        @if (showModal) {
          <div class="modal-overlay" (click)="showModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Add Chore</h3>
              
              <div class="form-group">
                <label>Title</label>
                <input type="text" [(ngModel)]="choreForm.title">
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="choreForm.description"></textarea>
              </div>
              
              <div class="form-group">
                <label>Assign To</label>
                <select [(ngModel)]="choreForm.assignedToId">
                  @for (member of members; track member.id) {
                    <option [value]="member.id">{{ member.name }}</option>
                  }
                </select>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Due Date</label>
                  <input type="date" [(ngModel)]="choreForm.dueDate">
                </div>
                <div class="form-group">
                  <label>Time (optional)</label>
                  <input type="time" [(ngModel)]="choreForm.dueTime">
                </div>
              </div>
              
              <div class="form-group">
                <label>Points</label>
                <input type="number" [(ngModel)]="choreForm.points" min="1" max="100">
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="showModal = false">Cancel</button>
                <button class="btn btn-primary" (click)="saveChore()">Save</button>
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
    
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 2rem;
    }
    
    .chores-section, .leaderboard-section {
      h2 {
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }
    }
    
    .chores-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .chore-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .chore-info {
        flex: 1;
        
        h4 { margin: 0 0 0.25rem; }
        p { color: var(--text-secondary); font-size: 0.875rem; margin: 0 0 0.5rem; }
        
        .chore-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
      
      .chore-points {
        text-align: center;
        
        .points {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        
        .label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }
    
    .leaderboard-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: var(--shadow);
    }
    
    .leaderboard-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
      
      &:last-child { border-bottom: none; }
      
      &.top-three .rank {
        background: var(--primary);
        color: white;
      }
      
      .rank {
        width: 28px;
        height: 28px;
        background: var(--background);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        margin-right: 0.75rem;
      }
      
      .name { flex: 1; }
      .points { color: var(--primary); font-weight: 600; }
    }
    
    .empty-state {
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
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
export class ChoresComponent implements OnInit {
  pendingChores: Chore[] = [];
  members: User[] = [];
  leaderboard: { userId: string; userName: string; points: number }[] = [];
  showModal = false;
  
  choreForm: any = {
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    dueTime: '',
    points: 10
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getPendingChores().subscribe(chores => {
      this.pendingChores = chores;
    });
    
    this.apiService.getHouseholdMembers().subscribe(members => {
      this.members = members;
      if (members.length > 0 && !this.choreForm.assignedToId) {
        this.choreForm.assignedToId = members[0].id;
      }
      this.loadLeaderboard();
    });
  }

  loadLeaderboard(): void {
    this.apiService.getLeaderboard().subscribe(lb => {
      this.leaderboard = Object.entries(lb)
        .map(([userId, points]) => ({
          userId,
          userName: this.members.find(m => m.id === userId)?.name || 'Unknown',
          points
        }))
        .sort((a, b) => b.points - a.points);
    });
  }

  getMemberName(id: string): string {
    return this.members.find(m => m.id === id)?.name || 'Unknown';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  completeChore(id: string): void {
    this.apiService.completeChore(id).subscribe(() => {
      this.loadData();
    });
  }

  saveChore(): void {
    if (!this.choreForm.title || !this.choreForm.assignedToId) return;

    this.apiService.createChore(this.choreForm).subscribe(() => {
      this.loadData();
      this.showModal = false;
      this.choreForm = {
        title: '',
        description: '',
        assignedToId: this.members[0]?.id || '',
        dueDate: '',
        dueTime: '',
        points: 10
      };
    });
  }
}
