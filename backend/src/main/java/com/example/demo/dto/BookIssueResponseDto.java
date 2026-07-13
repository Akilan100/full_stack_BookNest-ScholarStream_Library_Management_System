package com.example.demo.dto;

import com.example.demo.entity.IssueStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookIssueResponseDto {

    private Long id;
    private Long libraryBookId;
    private String bookTitle;
    private String bookIsbn;
    private Long libraryAccountId;
    private String accountEmail;
    private String accountFullName;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private IssueStatus status;
    private BigDecimal fineAmount;

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

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDateTime returnDate) { this.returnDate = returnDate; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public BigDecimal getFineAmount() { return fineAmount; }
    public void setFineAmount(BigDecimal fineAmount) { this.fineAmount = fineAmount; }
}
