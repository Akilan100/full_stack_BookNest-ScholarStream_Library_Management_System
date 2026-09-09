package com.example.demo.controller;

import com.example.demo.dto.FinePaymentRequestDto;
import com.example.demo.dto.FinePaymentResponseDto;
import com.example.demo.service.FinePaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
public class FinePaymentController {

    private final FinePaymentService finePaymentService;

    public FinePaymentController(FinePaymentService finePaymentService) {
        this.finePaymentService = finePaymentService;
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @GetMapping
    public ResponseEntity<List<FinePaymentResponseDto>> getAll() {
        return ResponseEntity.ok(finePaymentService.getAll());
    }

    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @GetMapping("/my")
    public ResponseEntity<List<FinePaymentResponseDto>> getMyFines(@org.springframework.security.core.annotation.AuthenticationPrincipal com.example.demo.entity.User currentUser) {
        return ResponseEntity.ok(finePaymentService.getByAccountId(currentUser.getId()));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PostMapping
    public ResponseEntity<FinePaymentResponseDto> createFine(@Valid @RequestBody FinePaymentRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(finePaymentService.createFine(dto));
    }

    @PreAuthorize("hasRole('LIBRARY_PATRON')")
    @PutMapping("/{id}/pay")
    public ResponseEntity<FinePaymentResponseDto> payFine(@PathVariable Long id) {
        return ResponseEntity.ok(finePaymentService.payFine(id));
    }

    @PreAuthorize("hasAnyRole('LIBRARIAN_STAFF','CHIEF_LIBRARIAN')")
    @PutMapping("/{id}/waive")
    public ResponseEntity<FinePaymentResponseDto> waiveFine(@PathVariable Long id) {
        return ResponseEntity.ok(finePaymentService.waiveFine(id));
    }
}
