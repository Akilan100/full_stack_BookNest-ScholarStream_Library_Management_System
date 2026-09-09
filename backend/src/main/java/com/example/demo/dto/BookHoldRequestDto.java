package com.example.demo.dto;

import java.time.LocalDateTime;

public class BookHoldRequestDto {

    private Long libraryBookId;
    private Long libraryAccountId;
    private LocalDateTime requestDate;

    public Long getLibraryBookId() {
        return libraryBookId;
    }

    public void setLibraryBookId(Long libraryBookId) {
        this.libraryBookId = libraryBookId;
    }

    public Long getBookId() {
        return libraryBookId;
    }

    public void setBookId(Long bookId) {
        if (this.libraryBookId == null) {
            this.libraryBookId = bookId;
        }
    }

    public Long getLibraryAccountId() {
        return libraryAccountId;
    }

    public void setLibraryAccountId(Long libraryAccountId) {
        this.libraryAccountId = libraryAccountId;
    }

    public Long getUserId() {
        return libraryAccountId;
    }

    public void setUserId(Long userId) {
        if (this.libraryAccountId == null) {
            this.libraryAccountId = userId;
        }
    }

    public Long getAccountId() {
        return libraryAccountId;
    }

    public void setAccountId(Long accountId) {
        if (this.libraryAccountId == null) {
            this.libraryAccountId = accountId;
        }
    }

    public LocalDateTime getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }
}
