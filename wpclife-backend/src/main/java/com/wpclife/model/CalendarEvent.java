package com.wpclife.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "calendar_events")
public class CalendarEvent {
    @Id
    private String id;
    
    private String title;
    private String description;
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    private EventType type;
    
    private List<String> participantIds;
    
    @Indexed
    private String householdId;
    
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum EventType {
        FAMILY, SCHOOL, MEDICAL, OTHER
    }
}
