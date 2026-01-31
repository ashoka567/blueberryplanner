package com.wpclife.repository;

import com.wpclife.model.MedicationLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicationLogRepository extends MongoRepository<MedicationLog, String> {
    List<MedicationLog> findByMedicationId(String medicationId);
    List<MedicationLog> findByHouseholdIdAndScheduledTimeBetween(String householdId, LocalDateTime start, LocalDateTime end);
    List<MedicationLog> findByUserIdAndScheduledTimeBetween(String userId, LocalDateTime start, LocalDateTime end);
}
