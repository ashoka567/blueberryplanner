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
@Document(collection = "chores")
public class Chore {
    @Id
    private String id;
    
    private String title;
    private String description;
    
    @Indexed
    private String assignedToId;
    
    private LocalDateTime startTime;
    private LocalDateTime dueDate;
    
    private int points;
    private boolean completed;
    private LocalDateTime completedAt;
    
    @Indexed
    private String householdId;
    
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
