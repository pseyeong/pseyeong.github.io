package com.pseyeong.place;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlaceApiController {

    private final PlaceRepository repository;
    private final ReportRepository reportRepository;

    public PlaceApiController(PlaceRepository repository, ReportRepository reportRepository) {
        this.repository = repository;
        this.reportRepository = reportRepository;
    }

    @GetMapping("/api/places")
    public List<PlaceSpot> places(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng,
            @RequestParam(defaultValue = "10") int maxCount,
            @RequestParam(defaultValue = "false") boolean vacantOnly,
            @RequestParam(defaultValue = "all") String group,
            @RequestParam(defaultValue = "200") int limit) {
        return repository.findInBounds(swLat, swLng, neLat, neLng, maxCount, vacantOnly, group, Math.min(limit, 500));
    }



    @GetMapping("/api/places/stores")
    public List<StoreView> stores(@RequestParam String address, @RequestParam String floor) {
        return repository.findStores(address, floor);
    }

    @GetMapping("/api/places/history")
    public PlaceHistory history(
            @RequestParam String building,
            @RequestParam String floor,
            @RequestParam(required = false) String unit) {
        return PlaceHistory.of(building, floor, unit,
                repository.findHistory(building, floor, unit),
                reportRepository.findApproved(building, floor, unit));
    }

    @GetMapping("/api/search")
    public List<StoreSearch> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {
        if (q.trim().length() < 2) {
            return List.of();
        }
        return repository.searchStores(q, Math.min(limit, 20));
    }

}
