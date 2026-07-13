package com.example.demo.dto;

import com.example.demo.entity.BookIssueRecord;

public class BookIssueMapper {

    public static BookIssueResponseDto toDto(BookIssueRecord record) {
        BookIssueResponseDto dto = new BookIssueResponseDto();
        dto.setId(record.getId());
        dto.setIssueDate(record.getIssueDate());
        dto.setDueDate(record.getDueDate());
        dto.setReturnDate(record.getReturnDate());
        dto.setStatus(record.getStatus());
        dto.setFineAmount(record.getFineAmount());
        if (record.getLibraryBook() != null) {
            dto.setLibraryBookId(record.getLibraryBook().getId());
            dto.setBookTitle(record.getLibraryBook().getTitle());
            dto.setBookIsbn(record.getLibraryBook().getIsbn());
        }
        if (record.getLibraryAccount() != null) {
            dto.setLibraryAccountId(record.getLibraryAccount().getId());
            dto.setAccountEmail(record.getLibraryAccount().getEmail());
            dto.setAccountFullName(record.getLibraryAccount().getFullName());
        }
        return dto;
    }
}
