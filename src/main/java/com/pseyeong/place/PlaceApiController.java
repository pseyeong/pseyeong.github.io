package com.pseyeong.place;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlaceApiController {

    private final PlaceRepository repository;

    public PlaceApiController(PlaceRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/places")
    public List<PlaceSpot> places(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng,
            @RequestParam(defaultValue = "10") int maxCount,
            @RequestParam(defaultValue = "200") int limit) {
        return repository.findInBounds(swLat, swLng, neLat, neLng, maxCount, Math.min(limit, 500));
    }

    @GetMapping("/api/places/stores")
    public List<StoreView> stores(@RequestParam String address, @RequestParam String floor) {
        return repository.findStores(address, floor);
    }

}
