package com.pseyeong.store;

public record StoreSearch(
        String name,
        String category,
        String status,
        String address,
        String floor,
        String roadAddr,
        Double lat,
        Double lng) {
}
