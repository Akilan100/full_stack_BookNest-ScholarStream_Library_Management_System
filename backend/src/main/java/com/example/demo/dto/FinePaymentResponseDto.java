package com.example.demo.dto;

import com.example.demo.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FinePaymentResponseDto {

    private Long id;
    private Long bookIssueRecordId;
    private String bookTitle;
    private Long libraryAccountId;
    private String accountEmail;
    private String accountFullName;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentStatus paymentStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBookIssueRecordId() { return bookIssueRecordId; }
    public void setBookIssueRecordId(Long bookIssueRecordId) { this.bookIssueRecordId = bookIssueRecordId; }

    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public String getAccountEmail() { return accountEmail; }
    public void setAccountEmail(String accountEmail) { this.accountEmail = accountEmail; }

    public String getAccountFullName() { return accountFullName; }
    public void setAccountFullName(String accountFullName) { this.accountFullName = accountFullName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getFineAmount() { return amount; }
    public void setFineAmount(BigDecimal fineAmount) { this.amount = fineAmount; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public PaymentStatus getStatus() { return paymentStatus; }
    public void setStatus(PaymentStatus status) { this.paymentStatus = status; }
}
