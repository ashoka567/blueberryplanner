package com.wpclife.repository;

import com.wpclife.model.Household;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseholdRepository extends MongoRepository<Household, String> {
    Optional<Household> findByInviteCode(String inviteCode);
}
