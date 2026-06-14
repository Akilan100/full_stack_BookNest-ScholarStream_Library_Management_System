package com.example.demo.controller;

import com.example.demo.entity.BookHoldRequest;
import com.example.demo.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN')")
    public ResponseEntity<List<BookHoldRequest>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN')")
    public ResponseEntity<BookHoldRequest> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<BookHoldRequest> createReservation(@RequestBody BookHoldRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.createReservation(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<Map<String, String>> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok(Map.of("message", "BookHoldRequest deleted successfully."));
    }
}
