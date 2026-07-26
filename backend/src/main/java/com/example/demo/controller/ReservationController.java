package com.example.demo.controller;

import com.example.demo.dto.BookHoldMapper;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.ReservationRequestDto;
import com.example.demo.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<BookHoldResponseDto>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations().stream().map(BookHoldMapper::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookHoldResponseDto> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(BookHoldMapper.toDto(reservationService.getReservationById(id)));
    }

    @PostMapping
    public ResponseEntity<BookHoldResponseDto> createReservation(@RequestBody ReservationRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(BookHoldMapper.toDto(reservationService.createReservation(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok(Map.of("message", "Reservation deleted successfully."));
    }
}
