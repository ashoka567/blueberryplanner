package com.wpclife.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScheduleRequest {
    @NotBlank(message = "Input text is required")
    private String text;
}
