package com.wpclife.repository;

import com.wpclife.model.Chore;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChoreRepository extends MongoRepository<Chore, String> {
    List<Chore> findByHouseholdId(String householdId);
    List<Chore> findByAssignedToId(String userId);
    List<Chore> findByHouseholdIdAndCompleted(String householdId, boolean completed);
    List<Chore> findByHouseholdIdAndDueDateBefore(String householdId, LocalDateTime dueDate);
}
