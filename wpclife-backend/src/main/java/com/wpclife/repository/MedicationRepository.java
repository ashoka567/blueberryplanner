package com.wpclife.repository;

import com.wpclife.model.Medication;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationRepository extends MongoRepository<Medication, String> {
    List<Medication> findByHouseholdId(String householdId);
    List<Medication> findByAssignedToId(String userId);
}
