package com.wpclife.controller;

import com.wpclife.model.Household;
import com.wpclife.model.User;
import com.wpclife.repository.HouseholdRepository;
import com.wpclife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/household")
    public ResponseEntity<List<User>> getHouseholdMembers(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<User> members = userRepository.findByHouseholdId(user.getHouseholdId());
        members.forEach(m -> m.setPassword(null));
        
        return ResponseEntity.ok(members);
    }
    
    @GetMapping("/household/invite-code")
    public ResponseEntity<String> getInviteCode(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Household household = householdRepository.findById(user.getHouseholdId())
                .orElseThrow(() -> new RuntimeException("Household not found"));
        
        return ResponseEntity.ok(household.getInviteCode());
    }
    
    @PatchMapping("/me")
    public ResponseEntity<User> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody User updates
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (updates.getName() != null) user.setName(updates.getName());
        if (updates.getAvatar() != null) user.setAvatar(updates.getAvatar());
        
        user = userRepository.save(user);
        user.setPassword(null);
        
        return ResponseEntity.ok(user);
    }
}
