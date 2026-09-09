package com.example.demo.controller;

import com.example.demo.dto.BookIssueRequestDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.entity.User;
import com.example.demo.service.BookIssueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/book-issues", "/api/issues"})
public class BookIssueController {

    private final BookIssueService bookIssueService;

    public BookIssueController(BookIssueService bookIssueService) {
        this.bookIssueService = bookIssueService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @GetMapping
    public ResponseEntity<List<BookIssueResponseDto>> getAll() {
        return ResponseEntity.ok(bookIssueService.getAll());
    }

    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @GetMapping("/my")
    public ResponseEntity<List<BookIssueResponseDto>> getMyIssues(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookIssueService.getByAccountId(currentUser.getId()));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @GetMapping("/{id}")
    public ResponseEntity<BookIssueResponseDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookIssueService.getById(id));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PostMapping
    public ResponseEntity<BookIssueResponseDto> issueBook(@Valid @RequestBody BookIssueRequestDto dto) {
        if (dto.getLibraryBookId() == null && dto.getBookId() != null) {
            dto.setLibraryBookId(dto.getBookId());
        }
        if (dto.getLibraryAccountId() == null && dto.getUserId() != null) {
            dto.setLibraryAccountId(dto.getUserId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bookIssueService.issueBook(dto));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/return")
    public ResponseEntity<BookIssueResponseDto> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(bookIssueService.returnBook(id));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/lost")
    public ResponseEntity<BookIssueResponseDto> markLost(@PathVariable Long id) {
        return ResponseEntity.ok(bookIssueService.markLost(id));
    }

    // LIBRARIAN_STAFF / CHIEF_LIBRARIAN — delete issue record
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        bookIssueService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Issue record deleted successfully."));
    }
}
