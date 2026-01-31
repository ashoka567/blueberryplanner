package com.wpclife.repository;

import com.wpclife.model.CalendarEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends MongoRepository<CalendarEvent, String> {
    List<CalendarEvent> findByHouseholdId(String householdId);
    List<CalendarEvent> findByHouseholdIdAndStartTimeBetween(String householdId, LocalDateTime start, LocalDateTime end);
    List<CalendarEvent> findByParticipantIdsContaining(String userId);
}
