package com.wpclife.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    private String message;
    private List<ParsedItem> items;
    private int choresCreated;
    private int eventsCreated;
    private int medicationsCreated;
    private int groceriesCreated;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedItem {
        private String type;
        private String title;
        private String description;
        private String dateTime;
        private Integer points;
    }
}
