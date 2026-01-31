package com.wpclife.repository;

import com.wpclife.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByHouseholdId(String householdId);
    List<AuditLog> findByHouseholdIdAndTimestampBetween(String householdId, LocalDateTime start, LocalDateTime end);
    List<AuditLog> findByUserId(String userId);
}
