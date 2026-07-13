package com.example.demo.dto;

import com.example.demo.entity.HoldStatus;
import java.time.LocalDateTime;

public class BookHoldResponseDto {

    private Long id;
    private Long libraryBookId;
    private String bookTitle;
    private String bookIsbn;
    private Long libraryAccountId;
    private String accountEmail;
    private String accountFullName;
    private LocalDateTime requestDate;
    private HoldStatus status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLibraryBookId() { return libraryBookId; }
    public void setLibraryBookId(Long libraryBookId) { this.libraryBookId = libraryBookId; }

    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

    public String getBookIsbn() { return bookIsbn; }
    public void setBookIsbn(String bookIsbn) { this.bookIsbn = bookIsbn; }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public String getAccountEmail() { return accountEmail; }
    public void setAccountEmail(String accountEmail) { this.accountEmail = accountEmail; }

    public String getAccountFullName() { return accountFullName; }
    public void setAccountFullName(String accountFullName) { this.accountFullName = accountFullName; }

    public LocalDateTime getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDateTime requestDate) { this.requestDate = requestDate; }

    public HoldStatus getStatus() { return status; }
    public void setStatus(HoldStatus status) { this.status = status; }
}
