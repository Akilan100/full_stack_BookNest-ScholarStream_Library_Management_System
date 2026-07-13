package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class BookIssueRequestDto {

    @NotNull
    private Long libraryBookId;

    @NotNull
    private Long libraryAccountId;

    private LocalDateTime dueDate;

    public Long getLibraryBookId() { return libraryBookId; }
    public void setLibraryBookId(Long libraryBookId) { this.libraryBookId = libraryBookId; }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
}
