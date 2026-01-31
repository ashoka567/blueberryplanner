package com.wpclife.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateChoreRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotBlank(message = "Assigned user is required")
    private String assignedToId;
    
    private LocalDateTime startTime;
    
    @NotNull(message = "Due date is required")
    private LocalDateTime dueDate;
    
    private int points = 10;
}
