package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fine_payment")
public class FinePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_issue_record_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private BookIssueRecord bookIssueRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_account_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User libraryAccount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "payment_status")
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BookIssueRecord getBookIssueRecord() { return bookIssueRecord; }
    public void setBookIssueRecord(BookIssueRecord bookIssueRecord) { this.bookIssueRecord = bookIssueRecord; }

    public User getLibraryAccount() { return libraryAccount; }
    public void setLibraryAccount(User libraryAccount) { this.libraryAccount = libraryAccount; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
}
