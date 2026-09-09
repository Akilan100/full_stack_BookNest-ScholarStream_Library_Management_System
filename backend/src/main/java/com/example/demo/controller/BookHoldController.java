package com.example.demo.controller;

import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.entity.User;
import com.example.demo.service.BookHoldService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/book-holds", "/api/holds"})
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

    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @GetMapping("/my")
    public ResponseEntity<List<BookHoldResponseDto>> getMyHolds(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookHoldService.getByAccountId(currentUser.getId()));
    }

    @PreAuthorize("hasAnyRole('LIBRARY_PATRON','LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PostMapping
    public ResponseEntity<BookHoldResponseDto> placeHold(@RequestBody BookHoldRequestDto dto,
                                                          @AuthenticationPrincipal User currentUser) {
        if ("LIBRARY_PATRON".equals(currentUser.getRole()) || dto.getLibraryAccountId() == null) {
            dto.setLibraryAccountId(currentUser.getId());
        }
        if (dto.getLibraryBookId() == null && dto.getBookId() != null) {
            dto.setLibraryBookId(dto.getBookId());
        }
        if (dto.getLibraryBookId() == null) {
            throw new com.example.demo.exception.BusinessValidationException("libraryBookId must not be null");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bookHoldService.placeHold(dto));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping({"/{id}/pickup", "/{id}/ready"})
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

    // STAFF / ADMIN — cancel any hold
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/admin-cancel")
    public ResponseEntity<BookHoldResponseDto> adminCancelHold(@PathVariable Long id) {
        return ResponseEntity.ok(bookHoldService.adminCancelHold(id));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        bookHoldService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Hold request deleted successfully."));
    }
}
