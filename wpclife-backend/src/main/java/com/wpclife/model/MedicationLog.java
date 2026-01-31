package com.wpclife.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "medication_logs")
public class MedicationLog {
    @Id
    private String id;
    
    @Indexed
    private String medicationId;
    
    private String userId;
    
    private Status status;
    
    private LocalDateTime scheduledTime;
    private LocalDateTime takenTime;
    
    private String notes;
    
    @Indexed
    private String householdId;
    
    private LocalDateTime createdAt;
    
    public enum Status {
        TAKEN, SKIPPED, MISSED
    }
}
