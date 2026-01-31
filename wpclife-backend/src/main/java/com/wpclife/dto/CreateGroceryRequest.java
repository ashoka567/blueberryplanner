package com.wpclife.dto;

import com.wpclife.model.GroceryItem;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateGroceryRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private GroceryItem.Category category = GroceryItem.Category.OTHER;
    
    private LocalDate neededByDate;
}
