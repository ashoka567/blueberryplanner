package com.wpclife.controller;

import com.wpclife.dto.CreateChoreRequest;
import com.wpclife.model.Chore;
import com.wpclife.model.User;
import com.wpclife.repository.ChoreRepository;
import com.wpclife.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chores")
@RequiredArgsConstructor
public class ChoreController {
    
    private final ChoreRepository choreRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<Chore>> getChores(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(choreRepository.findByHouseholdId(user.getHouseholdId()));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Chore>> getPendingChores(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(choreRepository.findByHouseholdIdAndCompleted(user.getHouseholdId(), false));
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<Map<String, Integer>> getLeaderboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Chore> completedChores = choreRepository.findByHouseholdIdAndCompleted(user.getHouseholdId(), true);
        
        Map<String, Integer> leaderboard = completedChores.stream()
                .collect(Collectors.groupingBy(
                        Chore::getAssignedToId,
                        Collectors.summingInt(Chore::getPoints)
                ));
        
        return ResponseEntity.ok(leaderboard);
    }
    
    @PostMapping
    public ResponseEntity<Chore> createChore(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateChoreRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Chore chore = Chore.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedToId(request.getAssignedToId())
                .startTime(request.getStartTime())
                .dueDate(request.getDueDate())
                .points(request.getPoints())
                .completed(false)
                .householdId(user.getHouseholdId())
                .createdBy(user.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return ResponseEntity.ok(choreRepository.save(chore));
    }
    
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Chore> completeChore(@PathVariable String id) {
        Chore chore = choreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chore not found"));
        
        chore.setCompleted(true);
        chore.setCompletedAt(LocalDateTime.now());
        chore.setUpdatedAt(LocalDateTime.now());
        
        return ResponseEntity.ok(choreRepository.save(chore));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChore(@PathVariable String id) {
        choreRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
