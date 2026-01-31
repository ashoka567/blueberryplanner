import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEvent, CreateEventRequest } from '../../shared/models/calendar.model';
import { Medication, MedicationLog, CreateMedicationRequest, LogMedicationRequest } from '../../shared/models/medication.model';
import { Chore, CreateChoreRequest } from '../../shared/models/chore.model';
import { GroceryItem, CreateGroceryRequest } from '../../shared/models/grocery.model';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Users
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/me`);
  }

  getHouseholdMembers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users/household`);
  }

  getInviteCode(): Observable<string> {
    return this.http.get(`${this.API_URL}/users/household/invite-code`, { responseType: 'text' });
  }

  // Calendar Events
  getEvents(start?: string, end?: string): Observable<CalendarEvent[]> {
    let url = `${this.API_URL}/events`;
    if (start && end) {
      url += `?start=${start}&end=${end}`;
    }
    return this.http.get<CalendarEvent[]>(url);
  }

  createEvent(event: CreateEventRequest): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${this.API_URL}/events`, event);
  }

  updateEvent(id: string, event: CreateEventRequest): Observable<CalendarEvent> {
    return this.http.put<CalendarEvent>(`${this.API_URL}/events/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/events/${id}`);
  }

  // Medications
  getMedications(): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.API_URL}/medications`);
  }

  createMedication(medication: CreateMedicationRequest): Observable<Medication> {
    return this.http.post<Medication>(`${this.API_URL}/medications`, medication);
  }

  logMedication(log: LogMedicationRequest): Observable<MedicationLog> {
    return this.http.post<MedicationLog>(`${this.API_URL}/medications/log`, log);
  }

  getMedicationLogs(medicationId: string): Observable<MedicationLog[]> {
    return this.http.get<MedicationLog[]>(`${this.API_URL}/medications/${medicationId}/logs`);
  }

  updateInventory(id: string, quantity: number): Observable<Medication> {
    return this.http.patch<Medication>(`${this.API_URL}/medications/${id}/inventory`, quantity);
  }

  deleteMedication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/medications/${id}`);
  }

  // Chores
  getChores(): Observable<Chore[]> {
    return this.http.get<Chore[]>(`${this.API_URL}/chores`);
  }

  getPendingChores(): Observable<Chore[]> {
    return this.http.get<Chore[]>(`${this.API_URL}/chores/pending`);
  }

  getLeaderboard(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.API_URL}/chores/leaderboard`);
  }

  createChore(chore: CreateChoreRequest): Observable<Chore> {
    return this.http.post<Chore>(`${this.API_URL}/chores`, chore);
  }

  completeChore(id: string): Observable<Chore> {
    return this.http.patch<Chore>(`${this.API_URL}/chores/${id}/complete`, {});
  }

  deleteChore(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/chores/${id}`);
  }

  // Groceries
  getGroceries(): Observable<GroceryItem[]> {
    return this.http.get<GroceryItem[]>(`${this.API_URL}/groceries`);
  }

  getPendingGroceries(): Observable<GroceryItem[]> {
    return this.http.get<GroceryItem[]>(`${this.API_URL}/groceries/pending`);
  }

  addGroceryItem(item: CreateGroceryRequest): Observable<GroceryItem> {
    return this.http.post<GroceryItem>(`${this.API_URL}/groceries`, item);
  }

  toggleGroceryItem(id: string): Observable<GroceryItem> {
    return this.http.patch<GroceryItem>(`${this.API_URL}/groceries/${id}/toggle`, {});
  }

  deleteGroceryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/groceries/${id}`);
  }

  clearCheckedGroceries(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/groceries/clear-checked`);
  }
}
