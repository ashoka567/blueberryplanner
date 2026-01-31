package com.wpclife.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wpclife.dto.ScheduleResponse;
import com.wpclife.model.*;
import com.wpclife.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIScheduleService {
    
    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;
    
    @Value("${OPENAI_API_URL:https://api.openai.com/v1}")
    private String openaiApiUrl;
    
    private final ChoreRepository choreRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final MedicationRepository medicationRepository;
    private final GroceryItemRepository groceryItemRepository;
    private final ObjectMapper objectMapper;
    
    private static final String SYSTEM_PROMPT = """
        You are a helpful family schedule assistant. Parse the user's free-form text and extract:
        - Chores (tasks with due dates, assign points 5-20 based on difficulty)
        - Calendar events (appointments, activities, family events)
        - Medication reminders (medicine names, times to take them)
        - Grocery items (things to buy, food items, household supplies)
        
        Return a JSON array of items. Each item should have:
        {
            "type": "chore" | "event" | "medication" | "grocery",
            "title": "title of the item",
            "description": "optional description",
            "dateTime": "ISO datetime string (YYYY-MM-DDTHH:mm:ss) or null",
            "endDateTime": "for events only, ISO string or null",
            "points": number (for chores only, 5-20),
            "dosage": "for medications only",
            "times": ["morning", "afternoon", "evening"] (for medications),
            "category": "PRODUCE" | "DAIRY" | "MEAT" | "PANTRY" | "OTHER" (for groceries)
        }
        
        If dates are relative like "tomorrow" or "next Monday", calculate from today's date.
        Today is: %s
        
        Return ONLY valid JSON array, no markdown or explanation.
        """;

    public ScheduleResponse processScheduleText(String text, User user) {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            return ScheduleResponse.builder()
                    .message("AI feature requires OpenAI API key. Please configure OPENAI_API_KEY in your environment.")
                    .items(Collections.emptyList())
                    .build();
        }
        
        try {
            String aiResponse = callOpenAI(text);
            if (aiResponse == null || aiResponse.isBlank()) {
                return ScheduleResponse.builder()
                        .message("Could not get a response from AI. Please try again.")
                        .items(Collections.emptyList())
                        .build();
            }
            
            List<Map<String, Object>> parsedItems = parseAIResponse(aiResponse);
            
            if (parsedItems.isEmpty()) {
                return ScheduleResponse.builder()
                        .message("I couldn't identify any tasks, events, medications, or grocery items in your message. Please try being more specific.")
                        .items(Collections.emptyList())
                        .build();
            }
            
            int choresCreated = 0;
            int eventsCreated = 0;
            int medicationsCreated = 0;
            int groceriesCreated = 0;
            List<ScheduleResponse.ParsedItem> responseItems = new ArrayList<>();
            
            for (Map<String, Object> item : parsedItems) {
                String type = (String) item.get("type");
                if (type == null || type.isBlank()) {
                    log.warn("Skipping item with missing type: {}", item);
                    continue;
                }
                
                String title = (String) item.get("title");
                if (title == null || title.isBlank()) {
                    log.warn("Skipping item with missing title: {}", item);
                    continue;
                }
                
                String description = (String) item.get("description");
                String dateTimeStr = (String) item.get("dateTime");
                
                ScheduleResponse.ParsedItem responseItem = ScheduleResponse.ParsedItem.builder()
                        .type(type)
                        .title(title)
                        .description(description)
                        .dateTime(dateTimeStr)
                        .build();
                
                try {
                    switch (type.toLowerCase()) {
                        case "chore" -> {
                            Chore chore = createChore(item, user);
                            choreRepository.save(chore);
                            choresCreated++;
                            responseItem.setPoints(chore.getPoints());
                        }
                        case "event" -> {
                            CalendarEvent event = createEvent(item, user);
                            calendarEventRepository.save(event);
                            eventsCreated++;
                        }
                        case "medication" -> {
                            Medication medication = createMedication(item, user);
                            medicationRepository.save(medication);
                            medicationsCreated++;
                        }
                        case "grocery" -> {
                            GroceryItem groceryItem = createGroceryItem(item, user);
                            groceryItemRepository.save(groceryItem);
                            groceriesCreated++;
                        }
                        default -> {
                            log.warn("Unknown item type: {}", type);
                            continue;
                        }
                    }
                    responseItems.add(responseItem);
                } catch (Exception e) {
                    log.error("Error saving item: {}", item, e);
                }
            }
            
            if (responseItems.isEmpty()) {
                return ScheduleResponse.builder()
                        .message("I understood your message but couldn't save any items. Please try again.")
                        .items(Collections.emptyList())
                        .build();
            }
            
            return ScheduleResponse.builder()
                    .message("Successfully processed your schedule!")
                    .items(responseItems)
                    .choresCreated(choresCreated)
                    .eventsCreated(eventsCreated)
                    .medicationsCreated(medicationsCreated)
                    .groceriesCreated(groceriesCreated)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error processing schedule text", e);
            return ScheduleResponse.builder()
                    .message("Sorry, I couldn't understand that. Please try again with clearer details.")
                    .items(Collections.emptyList())
                    .build();
        }
    }
    
    private String callOpenAI(String userText) {
        WebClient client = WebClient.builder()
                .baseUrl(openaiApiUrl)
                .defaultHeader("Authorization", "Bearer " + openaiApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        
        String systemPrompt = String.format(SYSTEM_PROMPT, LocalDateTime.now().format(DateTimeFormatter.ISO_DATE));
        
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userText)
                ),
                "temperature", 0.3,
                "max_tokens", 2000
        );
        
        String response = client.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse -> 
                    clientResponse.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error("OpenAI API error: {} - {}", clientResponse.statusCode(), body);
                            return Mono.error(new RuntimeException("OpenAI API error: " + clientResponse.statusCode()));
                        })
                )
                .bodyToMono(String.class)
                .block();
        
        if (response == null) {
            throw new RuntimeException("Empty response from OpenAI");
        }
        
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");
            if (choices.isMissingNode() || choices.isEmpty()) {
                throw new RuntimeException("No choices in OpenAI response");
            }
            return choices.get(0).path("message").path("content").asText();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }
    
    private List<Map<String, Object>> parseAIResponse(String response) {
        if (response == null || response.isBlank()) {
            return Collections.emptyList();
        }
        
        try {
            String cleaned = response.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            }
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            
            return objectMapper.readValue(cleaned.trim(), new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI response: {}", response, e);
            return Collections.emptyList();
        }
    }
    
    private Chore createChore(Map<String, Object> item, User user) {
        LocalDateTime dueDate = parseDateTime((String) item.get("dateTime"));
        Integer points = item.get("points") != null ? ((Number) item.get("points")).intValue() : 10;
        
        return Chore.builder()
                .title((String) item.get("title"))
                .description((String) item.get("description"))
                .dueDate(dueDate != null ? dueDate : LocalDateTime.now().plusDays(1))
                .points(points)
                .completed(false)
                .householdId(user.getHouseholdId())
                .createdBy(user.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    private CalendarEvent createEvent(Map<String, Object> item, User user) {
        LocalDateTime startTime = parseDateTime((String) item.get("dateTime"));
        LocalDateTime endTime = parseDateTime((String) item.get("endDateTime"));
        
        if (startTime == null) {
            startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        }
        if (endTime == null) {
            endTime = startTime.plusHours(1);
        }
        
        return CalendarEvent.builder()
                .title((String) item.get("title"))
                .description((String) item.get("description"))
                .startTime(startTime)
                .endTime(endTime)
                .type(CalendarEvent.EventType.OTHER)
                .participantIds(Collections.emptyList())
                .householdId(user.getHouseholdId())
                .createdBy(user.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    private Medication createMedication(Map<String, Object> item, User user) {
        @SuppressWarnings("unchecked")
        List<String> times = (List<String>) item.getOrDefault("times", Collections.emptyList());
        
        return Medication.builder()
                .name((String) item.get("title"))
                .dosage((String) item.getOrDefault("dosage", "As prescribed"))
                .instructions((String) item.get("description"))
                .morning(times.contains("morning"))
                .afternoon(times.contains("afternoon"))
                .evening(times.contains("evening"))
                .inventory(30)
                .householdId(user.getHouseholdId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    private GroceryItem createGroceryItem(Map<String, Object> item, User user) {
        String categoryStr = (String) item.getOrDefault("category", "OTHER");
        GroceryItem.Category category;
        try {
            category = GroceryItem.Category.valueOf(categoryStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            category = GroceryItem.Category.OTHER;
        }
        
        return GroceryItem.builder()
                .name((String) item.get("title"))
                .category(category)
                .neededByDate(LocalDate.now().plusDays(7))
                .checked(false)
                .addedById(user.getId())
                .householdId(user.getHouseholdId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            try {
                return LocalDateTime.parse(dateTimeStr);
            } catch (DateTimeParseException e2) {
                log.warn("Could not parse datetime: {}", dateTimeStr);
                return null;
            }
        }
    }
}
