package com.example.demo.controller;

import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.service.BookHoldService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // LIBRARIAN_STAFF / CHIEF_LIBRARIAN — view all holds
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @GetMapping
    public ResponseEntity<List<BookHoldResponseDto>> getAll() {
        return ResponseEntity.ok(bookHoldService.getAll());
    }

    // PATRON — view their own holds using ?libraryAccountId=
    @GetMapping("/my")
    public ResponseEntity<List<BookHoldResponseDto>> getMyHolds(@RequestParam Long libraryAccountId) {
        return ResponseEntity.ok(bookHoldService.getByAccountId(libraryAccountId));
    }

    // PATRON — place a hold
    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @PostMapping
    public ResponseEntity<BookHoldResponseDto> placeHold(@Valid @RequestBody BookHoldRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookHoldService.placeHold(dto));
    }

    // LIBRARIAN_STAFF / CHIEF_LIBRARIAN — mark book ready for pickup
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/pickup")
    public ResponseEntity<BookHoldResponseDto> markReadyForPickup(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.markReadyForPickup(id));
    }

    // LIBRARIAN_STAFF / CHIEF_LIBRARIAN — fulfill hold, hand book to patron
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/fulfill")
    public ResponseEntity<BookIssueResponseDto> fulfillHold(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.fulfillHold(id));
    }

    // PATRON — cancel their own hold
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookHoldResponseDto> cancelHold(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.cancelHold(id));
    }

    // LIBRARIAN_STAFF / CHIEF_LIBRARIAN — delete hold record
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        bookHoldService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Hold request deleted successfully."));
    }
}
