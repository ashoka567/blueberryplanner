package com.wpclife.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "grocery_items")
public class GroceryItem {
    @Id
    private String id;
    
    private String name;
    private Category category;
    private LocalDate neededByDate;
    
    private boolean checked;
    
    private String addedById;
    
    @Indexed
    private String householdId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum Category {
        PRODUCE, DAIRY, MEAT, PANTRY, OTHER
    }
}
