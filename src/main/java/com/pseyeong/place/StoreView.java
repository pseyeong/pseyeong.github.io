package com.pseyeong.place;

import java.time.LocalDate;

public record StoreView(
        String name,
        String category,
        String status,
        LocalDate openedAt,
        LocalDate closedAt) {
}
