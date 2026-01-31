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
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;
    
    private String action;
    private String entityType;
    private String entityId;
    
    @Indexed
    private String userId;
    
    @Indexed
    private String householdId;
    
    private String details;
    private String ipAddress;
    
    @Indexed
    private LocalDateTime timestamp;
}
