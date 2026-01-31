package com.wpclife.controller;

import com.wpclife.dto.CreateMedicationRequest;
import com.wpclife.dto.LogMedicationRequest;
import com.wpclife.model.Medication;
import com.wpclife.model.MedicationLog;
import com.wpclife.model.User;
import com.wpclife.repository.MedicationLogRepository;
import com.wpclife.repository.MedicationRepository;
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
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {
    
    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository logRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<Medication>> getMedications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(medicationRepository.findByHouseholdId(user.getHouseholdId()));
    }
    
    @PostMapping
    public ResponseEntity<Medication> createMedication(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateMedicationRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Medication medication = Medication.builder()
                .name(request.getName())
                .dosage(request.getDosage())
                .instructions(request.getInstructions())
                .morning(request.isMorning())
                .afternoon(request.isAfternoon())
                .evening(request.isEvening())
                .inventory(request.getInventory())
                .assignedToId(request.getAssignedToId())
                .householdId(user.getHouseholdId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return ResponseEntity.ok(medicationRepository.save(medication));
    }
    
    @PostMapping("/log")
    public ResponseEntity<MedicationLog> logMedication(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LogMedicationRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Medication medication = medicationRepository.findById(request.getMedicationId())
                .orElseThrow(() -> new RuntimeException("Medication not found"));
        
        if (request.getStatus() == MedicationLog.Status.TAKEN && medication.getInventory() > 0) {
            medication.setInventory(medication.getInventory() - 1);
            medicationRepository.save(medication);
        }
        
        MedicationLog log = MedicationLog.builder()
                .medicationId(request.getMedicationId())
                .userId(user.getId())
                .status(request.getStatus())
                .scheduledTime(request.getScheduledTime())
                .takenTime(request.getTakenTime() != null ? request.getTakenTime() : LocalDateTime.now())
                .notes(request.getNotes())
                .householdId(user.getHouseholdId())
                .createdAt(LocalDateTime.now())
                .build();
        
        return ResponseEntity.ok(logRepository.save(log));
    }
    
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<MedicationLog>> getMedicationLogs(@PathVariable String id) {
        return ResponseEntity.ok(logRepository.findByMedicationId(id));
    }
    
    @PatchMapping("/{id}/inventory")
    public ResponseEntity<Medication> updateInventory(
            @PathVariable String id,
            @RequestBody int quantity
    ) {
        Medication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication not found"));
        medication.setInventory(quantity);
        medication.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(medicationRepository.save(medication));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable String id) {
        medicationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
