package com.wpclife.controller;

import com.wpclife.dto.CreateEventRequest;
import com.wpclife.model.CalendarEvent;
import com.wpclife.model.User;
import com.wpclife.repository.CalendarEventRepository;
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
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class CalendarController {
    
    private final CalendarEventRepository eventRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<CalendarEvent>> getEvents(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) LocalDateTime start,
            @RequestParam(required = false) LocalDateTime end
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (start != null && end != null) {
            return ResponseEntity.ok(
                    eventRepository.findByHouseholdIdAndStartTimeBetween(user.getHouseholdId(), start, end)
            );
        }
        return ResponseEntity.ok(eventRepository.findByHouseholdId(user.getHouseholdId()));
    }
    
    @PostMapping
    public ResponseEntity<CalendarEvent> createEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateEventRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        CalendarEvent event = CalendarEvent.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .type(request.getType())
                .participantIds(request.getParticipantIds())
                .householdId(user.getHouseholdId())
                .createdBy(user.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return ResponseEntity.ok(eventRepository.save(event));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CalendarEvent> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody CreateEventRequest request
    ) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setType(request.getType());
        event.setParticipantIds(request.getParticipantIds());
        event.setUpdatedAt(LocalDateTime.now());
        
        return ResponseEntity.ok(eventRepository.save(event));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
