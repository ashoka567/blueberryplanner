package com.wpclife.controller;

import com.wpclife.dto.ScheduleRequest;
import com.wpclife.dto.ScheduleResponse;
import com.wpclife.model.User;
import com.wpclife.repository.UserRepository;
import com.wpclife.service.AIScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIScheduleController {
    
    private final AIScheduleService aiScheduleService;
    private final UserRepository userRepository;
    
    @PostMapping("/schedule")
    @PreAuthorize("hasRole('GUARDIAN')")
    public ResponseEntity<ScheduleResponse> processSchedule(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ScheduleRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(
                    ScheduleResponse.builder()
                            .message("Authentication required")
                            .items(Collections.emptyList())
                            .build()
            );
        }
        
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(
                    ScheduleResponse.builder()
                            .message("User not found")
                            .items(Collections.emptyList())
                            .build()
            );
        }
        
        ScheduleResponse response = aiScheduleService.processScheduleText(request.getText(), user);
        return ResponseEntity.ok(response);
    }
}
