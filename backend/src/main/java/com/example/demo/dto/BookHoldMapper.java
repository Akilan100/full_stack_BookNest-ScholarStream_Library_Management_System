package com.example.demo.dto;

import com.example.demo.entity.BookHoldRequest;

public class BookHoldMapper {

    public static BookHoldResponseDto toDto(BookHoldRequest hold) {
        BookHoldResponseDto dto = new BookHoldResponseDto();
        dto.setId(hold.getId());
        dto.setRequestDate(hold.getRequestDate());
        dto.setStatus(hold.getStatus());
        if (hold.getLibraryBook() != null) {
            dto.setLibraryBookId(hold.getLibraryBook().getId());
            dto.setBookTitle(hold.getLibraryBook().getTitle());
            dto.setBookIsbn(hold.getLibraryBook().getIsbn());
        }
        if (hold.getLibraryAccount() != null) {
            dto.setLibraryAccountId(hold.getLibraryAccount().getId());
            dto.setAccountEmail(hold.getLibraryAccount().getEmail());
            dto.setAccountFullName(hold.getLibraryAccount().getFullName());
        }
        return dto;
    }
}
