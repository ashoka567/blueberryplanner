package com.wpclife.dto;

import com.wpclife.model.MedicationLog;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LogMedicationRequest {
    @NotBlank(message = "Medication ID is required")
    private String medicationId;
    
    @NotNull(message = "Status is required")
    private MedicationLog.Status status;
    
    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;
    
    private LocalDateTime takenTime;
    private String notes;
}
