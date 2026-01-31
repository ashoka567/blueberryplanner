package com.wpclife.repository;

import com.wpclife.model.GroceryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroceryItemRepository extends MongoRepository<GroceryItem, String> {
    List<GroceryItem> findByHouseholdId(String householdId);
    List<GroceryItem> findByHouseholdIdAndChecked(String householdId, boolean checked);
    List<GroceryItem> findByHouseholdIdAndCategory(String householdId, GroceryItem.Category category);
}
