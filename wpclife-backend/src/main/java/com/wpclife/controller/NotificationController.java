package com.wpclife.controller;

import com.wpclife.model.DeviceToken;
import com.wpclife.model.User;
import com.wpclife.repository.DeviceTokenRepository;
import com.wpclife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final DeviceTokenRepository tokenRepository;
    private final UserRepository userRepository;
    
    @PostMapping("/register")
    public ResponseEntity<Void> registerDevice(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String token = request.get("token");
        
        if (tokenRepository.findByToken(token).isEmpty()) {
            DeviceToken deviceToken = DeviceToken.builder()
                    .userId(user.getId())
                    .token(token)
                    .platform(request.getOrDefault("platform", "ios"))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            tokenRepository.save(deviceToken);
        }
        
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/unregister")
    public ResponseEntity<Void> unregisterDevice(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        tokenRepository.deleteByToken(token);
        return ResponseEntity.ok().build();
    }
}
