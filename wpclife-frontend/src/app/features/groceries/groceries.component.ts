import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { GroceryItem, CreateGroceryRequest } from '../../shared/models/grocery.model';

@Component({
  selector: 'app-groceries',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <main class="main-content">
        <header class="mobile-header">
          <h1>Groceries</h1>
          <button class="btn btn-close" routerLink="/dashboard">Close</button>
        </header>
        <div class="page-actions">
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="clearChecked()">Clear Checked</button>
            <button class="btn btn-primary" (click)="showModal = true">Add Item</button>
          </div>
        </div>
        
        <div class="grocery-container">
          @for (category of categories; track category) {
            @if (getItemsByCategory(category).length > 0) {
              <section class="category-section">
                <h3>{{ category }}</h3>
                <ul class="grocery-list">
                  @for (item of getItemsByCategory(category); track item.id) {
                    <li class="grocery-item" [class.checked]="item.checked">
                      <label class="checkbox-label">
                        <input 
                          type="checkbox" 
                          [checked]="item.checked"
                          (change)="toggleItem(item.id)"
                        >
                        <span class="item-name">{{ item.name }}</span>
                      </label>
                      @if (item.neededByDate) {
                        <span class="needed-by">by {{ formatDate(item.neededByDate) }}</span>
                      }
                      <button class="delete-btn" (click)="deleteItem(item.id)">×</button>
                    </li>
                  }
                </ul>
              </section>
            }
          }
          
          @if (groceries.length === 0) {
            <div class="empty-state">
              <p>Your grocery list is empty</p>
              <button class="btn btn-primary" (click)="showModal = true">Add your first item</button>
            </div>
          }
        </div>
        
        @if (showModal) {
          <div class="modal-overlay" (click)="showModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Add Grocery Item</h3>
              
              <div class="form-group">
                <label>Item Name</label>
                <input type="text" [(ngModel)]="itemForm.name" placeholder="e.g., Milk">
              </div>
              
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="itemForm.category">
                  <option value="PRODUCE">Produce</option>
                  <option value="DAIRY">Dairy</option>
                  <option value="MEAT">Meat</option>
                  <option value="PANTRY">Pantry</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Needed By (optional)</label>
                <input type="date" [(ngModel)]="itemForm.neededByDate">
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="showModal = false">Cancel</button>
                <button class="btn btn-primary" (click)="addItem()">Add</button>
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
      align-items: center; 
      margin-bottom: 1.5rem; 
      
      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }
    
    .grocery-container {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }
    
    .category-section {
      margin-bottom: 1.5rem;
      
      &:last-child { margin-bottom: 0; }
      
      h3 {
        font-size: 0.875rem;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border);
      }
    }
    
    .grocery-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .grocery-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
      
      &:last-child { border-bottom: none; }
      
      &.checked .item-name {
        text-decoration: line-through;
        color: var(--text-secondary);
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        cursor: pointer;
        
        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accent-color: var(--primary);
        }
      }
      
      .needed-by {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-right: 1rem;
      }
      
      .delete-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 1.25rem;
        cursor: pointer;
        border-radius: 0.25rem;
        
        &:hover {
          background: #fee2e2;
          color: var(--danger);
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      
      p {
        color: var(--text-secondary);
        margin-bottom: 1rem;
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
      max-width: 400px;
      
      h3 { margin: 0 0 1.5rem; }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  `]
})
export class GroceriesComponent implements OnInit {
  groceries: GroceryItem[] = [];
  categories = ['PRODUCE', 'DAIRY', 'MEAT', 'PANTRY', 'OTHER'];
  showModal = false;
  
  itemForm: CreateGroceryRequest = {
    name: '',
    category: 'OTHER',
    neededByDate: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadGroceries();
  }

  loadGroceries(): void {
    this.apiService.getGroceries().subscribe(items => {
      this.groceries = items;
    });
  }

  getItemsByCategory(category: string): GroceryItem[] {
    return this.groceries.filter(item => item.category === category);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  toggleItem(id: string): void {
    this.apiService.toggleGroceryItem(id).subscribe(() => {
      this.loadGroceries();
    });
  }

  deleteItem(id: string): void {
    this.apiService.deleteGroceryItem(id).subscribe(() => {
      this.loadGroceries();
    });
  }

  clearChecked(): void {
    this.apiService.clearCheckedGroceries().subscribe(() => {
      this.loadGroceries();
    });
  }

  addItem(): void {
    if (!this.itemForm.name) return;

    this.apiService.addGroceryItem(this.itemForm).subscribe(() => {
      this.loadGroceries();
      this.showModal = false;
      this.itemForm = {
        name: '',
        category: 'OTHER',
        neededByDate: ''
      };
    });
  }
}
