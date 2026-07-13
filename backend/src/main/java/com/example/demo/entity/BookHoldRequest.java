package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_hold_request")
public class BookHoldRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_book_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "reservations"})
    private LibraryBook libraryBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_account_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User libraryAccount;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private HoldStatus status;

    // Legacy field kept for backward compatibility with existing ReservationService
    @Transient
    private String username;

    // Legacy accessor kept so existing ReservationService compiles unchanged
    public String getUsername() { return libraryAccount != null ? libraryAccount.getEmail() : username; }
    public void setUsername(String username) { this.username = username; }

    // Legacy book accessor kept so existing ReservationService compiles unchanged
    public LibraryBook getBook() { return libraryBook; }
    public void setBook(LibraryBook book) { this.libraryBook = book; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LibraryBook getLibraryBook() { return libraryBook; }
    public void setLibraryBook(LibraryBook libraryBook) { this.libraryBook = libraryBook; }

    public User getLibraryAccount() { return libraryAccount; }
    public void setLibraryAccount(User libraryAccount) { this.libraryAccount = libraryAccount; }

    public LocalDateTime getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDateTime requestDate) { this.requestDate = requestDate; }

    public HoldStatus getStatus() { return status; }
    public void setStatus(HoldStatus status) { this.status = status; }
}
