package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FinePaymentRequestDto {

    @NotNull
    private Long bookIssueRecordId;

    @NotNull
    private Long libraryAccountId;

    @NotNull
    private BigDecimal amount;

    private LocalDateTime paymentDate;

    public Long getBookIssueRecordId() { return bookIssueRecordId; }
    public void setBookIssueRecordId(Long bookIssueRecordId) { this.bookIssueRecordId = bookIssueRecordId; }

    public Long getLibraryAccountId() { return libraryAccountId; }
    public void setLibraryAccountId(Long libraryAccountId) { this.libraryAccountId = libraryAccountId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
}
