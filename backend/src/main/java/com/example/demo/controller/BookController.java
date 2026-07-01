package com.example.demo.controller;

import com.example.demo.dto.BookRequestDto;
import com.example.demo.entity.LibraryBook;
import com.example.demo.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON')")
    public ResponseEntity<Page<LibraryBook>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(bookService.getAllBooks(page, size, title, category));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON')")
    public ResponseEntity<LibraryBook> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<LibraryBook> createBook(@Valid @RequestBody BookRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.createBook(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN')")
    public ResponseEntity<LibraryBook> updateBook(@PathVariable Long id, @Valid @RequestBody BookRequestDto dto) {
        return ResponseEntity.ok(bookService.updateBook(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok("LibraryBook deleted successfully.");
    }
}
