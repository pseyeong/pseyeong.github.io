package com.pseyeong.place;

import java.time.LocalDate;

public record PlaceSpot(
        long id,
        String address,
        String floor,
        int count,
        int closed,
        LocalDate lastClosedAt,
        double lat,
        double lng) {
}
