package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class BookHoldRequestDto {

    @NotNull
    private Long libraryBookId;

    @NotNull
    private Long libraryAccountId;

    private LocalDateTime requestDate;

    public Long getLibraryBookId() { return libraryBookId; }
    public void setLibraryBookId(Long libraryBookId) { this.libraryBookId = libraryBookId; }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public LocalDateTime getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDateTime requestDate) { this.requestDate = requestDate; }
}
