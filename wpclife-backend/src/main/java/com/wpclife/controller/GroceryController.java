package com.wpclife.controller;

import com.wpclife.dto.CreateGroceryRequest;
import com.wpclife.model.GroceryItem;
import com.wpclife.model.User;
import com.wpclife.repository.GroceryItemRepository;
import com.wpclife.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/groceries")
@RequiredArgsConstructor
public class GroceryController {
    
    private final GroceryItemRepository groceryRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<GroceryItem>> getGroceries(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(groceryRepository.findByHouseholdId(user.getHouseholdId()));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<GroceryItem>> getPendingGroceries(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(groceryRepository.findByHouseholdIdAndChecked(user.getHouseholdId(), false));
    }
    
    @PostMapping
    public ResponseEntity<GroceryItem> addGroceryItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateGroceryRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        GroceryItem item = GroceryItem.builder()
                .name(request.getName())
                .category(request.getCategory())
                .neededByDate(request.getNeededByDate())
                .checked(false)
                .addedById(user.getId())
                .householdId(user.getHouseholdId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return ResponseEntity.ok(groceryRepository.save(item));
    }
    
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<GroceryItem> toggleItem(@PathVariable String id) {
        GroceryItem item = groceryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        item.setChecked(!item.isChecked());
        item.setUpdatedAt(LocalDateTime.now());
        
        return ResponseEntity.ok(groceryRepository.save(item));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        groceryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/clear-checked")
    public ResponseEntity<Void> clearCheckedItems(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<GroceryItem> checkedItems = groceryRepository.findByHouseholdIdAndChecked(user.getHouseholdId(), true);
        groceryRepository.deleteAll(checkedItems);
        
        return ResponseEntity.noContent().build();
    }
}
