package com.wpclife.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "households")
public class Household {
    @Id
    private String id;
    
    private String name;
    private String inviteCode;
    private List<String> memberIds;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
