package com.wpclife.service;

import com.wpclife.dto.AuthRequest;
import com.wpclife.dto.AuthResponse;
import com.wpclife.dto.RegisterRequest;
import com.wpclife.model.Household;
import com.wpclife.model.User;
import com.wpclife.repository.HouseholdRepository;
import com.wpclife.repository.UserRepository;
import com.wpclife.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        String householdId;
        
        if (request.getInviteCode() != null && !request.getInviteCode().isEmpty()) {
            Household household = householdRepository.findByInviteCode(request.getInviteCode())
                    .orElseThrow(() -> new RuntimeException("Invalid invite code"));
            householdId = household.getId();
            household.getMemberIds().add(request.getEmail());
            householdRepository.save(household);
        } else {
            Household household = Household.builder()
                    .name(request.getHouseholdName() != null ? request.getHouseholdName() : request.getName() + "'s Family")
                    .inviteCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .memberIds(new ArrayList<>())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            household = householdRepository.save(household);
            householdId = household.getId();
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(request.getRole())
                .householdId(householdId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        user = userRepository.save(user);
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return buildAuthResponse(user, accessToken, refreshToken);
    }
    
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return buildAuthResponse(user, accessToken, refreshToken);
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Invalid refresh token");
        }
        
        String newAccessToken = jwtService.generateToken(userDetails);
        
        return buildAuthResponse(user, newAccessToken, refreshToken);
    }
    
    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .avatar(user.getAvatar())
                        .role(user.getRole())
                        .householdId(user.getHouseholdId())
                        .build())
                .build();
    }
}
