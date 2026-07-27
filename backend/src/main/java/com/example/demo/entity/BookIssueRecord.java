package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_issue_record")
public class BookIssueRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_book_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "reservations"})
    private LibraryBook libraryBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_account_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User libraryAccount;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private IssueStatus status;

    @Column(name = "fine_amount", precision = 10, scale = 2)
    private BigDecimal fineAmount;

    @OneToOne(mappedBy = "bookIssueRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private FinePayment finePayment;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LibraryBook getLibraryBook() { return libraryBook; }
    public void setLibraryBook(LibraryBook libraryBook) { this.libraryBook = libraryBook; }

    public User getLibraryAccount() { return libraryAccount; }
    public void setLibraryAccount(User libraryAccount) { this.libraryAccount = libraryAccount; }

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
