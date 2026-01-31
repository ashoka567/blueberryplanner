export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'FAMILY' | 'SCHOOL' | 'MEDICAL' | 'OTHER';
  participantIds: string[];
  householdId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type?: 'FAMILY' | 'SCHOOL' | 'MEDICAL' | 'OTHER';
  participantIds?: string[];
}
