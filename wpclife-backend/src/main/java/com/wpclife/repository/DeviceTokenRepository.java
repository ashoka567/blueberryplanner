package com.wpclife.repository;

import com.wpclife.model.DeviceToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends MongoRepository<DeviceToken, String> {
    List<DeviceToken> findByUserId(String userId);
    Optional<DeviceToken> findByToken(String token);
    void deleteByToken(String token);
}
