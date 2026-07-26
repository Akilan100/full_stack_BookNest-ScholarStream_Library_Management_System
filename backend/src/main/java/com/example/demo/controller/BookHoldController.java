package com.example.demo.controller;

import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.entity.User;
import com.example.demo.service.BookHoldService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @GetMapping
    public ResponseEntity<List<BookHoldResponseDto>> getAll() {
        return ResponseEntity.ok(bookHoldService.getAll());
    }

    // PATRON — view only their own holds (JWT identity enforced)
    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @GetMapping("/my")
    public ResponseEntity<List<BookHoldResponseDto>> getMyHolds(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookHoldService.getByAccountId(currentUser.getId()));
    }

    // PATRON — place a hold (libraryAccountId overridden from JWT)
    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @PostMapping
    public ResponseEntity<BookHoldResponseDto> placeHold(@Valid @RequestBody BookHoldRequestDto dto,
                                                          @AuthenticationPrincipal User currentUser) {
        dto.setLibraryAccountId(currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookHoldService.placeHold(dto));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/pickup")
    public ResponseEntity<BookHoldResponseDto> markReadyForPickup(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.markReadyForPickup(id));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/fulfill")
    public ResponseEntity<BookIssueResponseDto> fulfillHold(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.fulfillHold(id));
    }

    // PATRON — cancel only their own hold
    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookHoldResponseDto> cancelHold(@PathVariable Long id,
                                                           @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookHoldService.cancelHold(id, currentUser.getId()));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        bookHoldService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Hold request deleted successfully."));
    }
}
