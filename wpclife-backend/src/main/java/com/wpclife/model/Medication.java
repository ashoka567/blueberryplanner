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
@Document(collection = "medications")
public class Medication {
    @Id
    private String id;
    
    private String name;
    private String dosage;
    private String instructions;
    
    private boolean morning;
    private boolean afternoon;
    private boolean evening;
    
    private int inventory;
    
    @Indexed
    private String assignedToId;
    
    @Indexed
    private String householdId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
