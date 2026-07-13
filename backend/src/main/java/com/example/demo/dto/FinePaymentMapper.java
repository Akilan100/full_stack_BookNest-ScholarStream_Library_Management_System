package com.example.demo.dto;

import com.example.demo.entity.FinePayment;

public class FinePaymentMapper {

    public static FinePaymentResponseDto toDto(FinePayment payment) {
        FinePaymentResponseDto dto = new FinePaymentResponseDto();
        dto.setId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setPaymentStatus(payment.getPaymentStatus());
        if (payment.getBookIssueRecord() != null) {
            dto.setBookIssueRecordId(payment.getBookIssueRecord().getId());
            if (payment.getBookIssueRecord().getLibraryBook() != null) {
                dto.setBookTitle(payment.getBookIssueRecord().getLibraryBook().getTitle());
            }
        }
        if (payment.getLibraryAccount() != null) {
            dto.setLibraryAccountId(payment.getLibraryAccount().getId());
            dto.setAccountEmail(payment.getLibraryAccount().getEmail());
            dto.setAccountFullName(payment.getLibraryAccount().getFullName());
        }
        return dto;
    }
}
