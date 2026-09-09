package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FinePaymentRequestDto {

    private Long bookIssueRecordId;

    private Long libraryAccountId;

    private BigDecimal amount;

    private LocalDateTime paymentDate;

    public Long getBookIssueRecordId() { return bookIssueRecordId; }
    public void setBookIssueRecordId(Long bookIssueRecordId) { this.bookIssueRecordId = bookIssueRecordId; }

    public Long getIssueRecordId() { return bookIssueRecordId; }
    public void setIssueRecordId(Long issueRecordId) {
        if (this.bookIssueRecordId == null) {
            this.bookIssueRecordId = issueRecordId;
        }
    }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public Long getUserId() { return libraryAccountId; }
    public void setUserId(Long userId) {
        if (this.libraryAccountId == null) {
            this.libraryAccountId = userId;
        }
    }

    public Long getAccountId() { return libraryAccountId; }
    public void setAccountId(Long accountId) {
        if (this.libraryAccountId == null) {
            this.libraryAccountId = accountId;
        }
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getFineAmount() { return amount; }
    public void setFineAmount(BigDecimal fineAmount) {
        if (this.amount == null) {
            this.amount = fineAmount;
        }
    }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
}
