package com.wpclife.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateMedicationRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String dosage;
    private String instructions;
    
    private boolean morning;
    private boolean afternoon;
    private boolean evening;
    
    @NotNull(message = "Initial inventory is required")
    private Integer inventory;
    
    @NotBlank(message = "Assigned user is required")
    private String assignedToId;
}
