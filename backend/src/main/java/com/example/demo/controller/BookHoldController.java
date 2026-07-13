package com.example.demo.controller;

import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.service.BookHoldService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/book-holds")
public class BookHoldController {

    private final BookHoldService bookHoldService;

    public BookHoldController(BookHoldService bookHoldService) {
        this.bookHoldService = bookHoldService;
    }

    @GetMapping
    public ResponseEntity<List<BookHoldResponseDto>> getAll() {
        return ResponseEntity.ok(bookHoldService.getAll());
    }

    @PostMapping
    public ResponseEntity<BookHoldResponseDto> placeHold(@Valid @RequestBody BookHoldRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookHoldService.placeHold(dto));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookHoldResponseDto> cancelHold(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.cancelHold(id));
    }

    @PutMapping("/{id}/pickup")
    public ResponseEntity<BookHoldResponseDto> markReadyForPickup(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.markReadyForPickup(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        bookHoldService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Hold request deleted successfully."));
    }
}
