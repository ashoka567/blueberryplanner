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
@Document(collection = "device_tokens")
public class DeviceToken {
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String token;
    private String platform;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
