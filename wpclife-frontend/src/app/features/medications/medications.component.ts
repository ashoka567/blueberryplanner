import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Medication, CreateMedicationRequest } from '../../shared/models/medication.model';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Medications</h1>
          <button class="btn btn-close" routerLink="/dashboard">Close</button>
        </header>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="showModal = true">Add Medication</button>
        </div>
        
        <div class="medications-grid">
          @for (med of medications; track med.id) {
            <div class="med-card">
              <div class="med-header">
                <h3>{{ med.name }}</h3>
                @if (med.inventory < 10) {
                  <span class="badge badge-warning">Low Stock</span>
                }
              </div>
              
              <p class="dosage">{{ med.dosage }}</p>
              <p class="instructions">{{ med.instructions }}</p>
              
              <div class="schedule">
                <span [class.active]="med.morning">Morning</span>
                <span [class.active]="med.afternoon">Afternoon</span>
                <span [class.active]="med.evening">Evening</span>
              </div>
              
              <div class="inventory">
                <span>Inventory: {{ med.inventory }}</span>
                <div class="inventory-controls">
                  <button (click)="updateInventory(med.id, med.inventory - 1)">-</button>
                  <button (click)="updateInventory(med.id, med.inventory + 1)">+</button>
                </div>
              </div>
              
              <div class="assigned-to">
                Assigned to: {{ getMemberName(med.assignedToId) }}
              </div>
              
              <div class="actions">
                <button class="btn btn-primary" (click)="logDose(med.id, 'TAKEN')">
                  Mark Taken
                </button>
                <button class="btn btn-secondary" (click)="logDose(med.id, 'SKIPPED')">
                  Skip
                </button>
              </div>
            </div>
          }
        </div>
        
        @if (showModal) {
          <div class="modal-overlay" (click)="showModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Add Medication</h3>
              
              <div class="form-group">
                <label>Name</label>
                <input type="text" [(ngModel)]="medForm.name">
              </div>
              
              <div class="form-group">
                <label>Dosage</label>
                <input type="text" [(ngModel)]="medForm.dosage" placeholder="e.g., 10mg">
              </div>
              
              <div class="form-group">
                <label>Instructions</label>
                <textarea [(ngModel)]="medForm.instructions" placeholder="Take with food..."></textarea>
              </div>
              
              <div class="form-group">
                <label>Schedule</label>
                <div class="checkbox-group">
                  <label><input type="checkbox" [(ngModel)]="medForm.morning"> Morning</label>
                  <label><input type="checkbox" [(ngModel)]="medForm.afternoon"> Afternoon</label>
                  <label><input type="checkbox" [(ngModel)]="medForm.evening"> Evening</label>
                </div>
              </div>
              
              <div class="form-group">
                <label>Initial Inventory</label>
                <input type="number" [(ngModel)]="medForm.inventory">
              </div>
              
              <div class="form-group">
                <label>Assigned To</label>
                <select [(ngModel)]="medForm.assignedToId">
                  @for (member of members; track member.id) {
                    <option [value]="member.id">{{ member.name }}</option>
                  }
                </select>
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="showModal = false">Cancel</button>
                <button class="btn btn-primary" (click)="saveMedication()">Save</button>
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
    
    .medications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .med-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      
      .med-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        
        h3 { margin: 0; }
      }
      
      .dosage {
        color: var(--primary);
        font-weight: 500;
        margin-bottom: 0.25rem;
      }
      
      .instructions {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
      
      .schedule {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        
        span {
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          background: var(--background);
          color: var(--text-secondary);
          
          &.active {
            background: var(--primary);
            color: white;
          }
        }
      }
      
      .inventory {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        
        .inventory-controls {
          display: flex;
          gap: 0.25rem;
          
          button {
            width: 28px;
            height: 28px;
            border: 1px solid var(--border);
            background: white;
            border-radius: 0.25rem;
            cursor: pointer;
            
            &:hover { background: var(--background); }
          }
        }
      }
      
      .assigned-to {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }
      
      .actions {
        display: flex;
        gap: 0.5rem;
        
        button { flex: 1; }
      }
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
    
    .checkbox-group {
      display: flex;
      gap: 1rem;
      
      label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        cursor: pointer;
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  `]
})
export class MedicationsComponent implements OnInit {
  medications: Medication[] = [];
  members: User[] = [];
  showModal = false;
  
  medForm: CreateMedicationRequest = {
    name: '',
    dosage: '',
    instructions: '',
    morning: false,
    afternoon: false,
    evening: false,
    inventory: 30,
    assignedToId: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getMedications().subscribe(meds => {
      this.medications = meds;
    });
    
    this.apiService.getHouseholdMembers().subscribe(members => {
      this.members = members;
      if (members.length > 0 && !this.medForm.assignedToId) {
        this.medForm.assignedToId = members[0].id;
      }
    });
  }

  getMemberName(id: string): string {
    return this.members.find(m => m.id === id)?.name || 'Unknown';
  }

  updateInventory(id: string, quantity: number): void {
    if (quantity < 0) return;
    this.apiService.updateInventory(id, quantity).subscribe(() => {
      this.loadData();
    });
  }

  logDose(medicationId: string, status: 'TAKEN' | 'SKIPPED'): void {
    this.apiService.logMedication({
      medicationId,
      status,
      scheduledTime: new Date().toISOString()
    }).subscribe(() => {
      if (status === 'TAKEN') {
        this.loadData();
      }
    });
  }

  saveMedication(): void {
    if (!this.medForm.name || !this.medForm.assignedToId) return;

    this.apiService.createMedication(this.medForm).subscribe(() => {
      this.loadData();
      this.showModal = false;
      this.medForm = {
        name: '',
        dosage: '',
        instructions: '',
        morning: false,
        afternoon: false,
        evening: false,
        inventory: 30,
        assignedToId: this.members[0]?.id || ''
      };
    });
  }
}
