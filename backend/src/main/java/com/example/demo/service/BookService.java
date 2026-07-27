package com.example.demo.service;

import com.example.demo.dto.BookRequestDto;
import com.example.demo.entity.LibraryBook;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.LibraryBookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class BookService {

    private final LibraryBookRepository bookRepository;

    public BookService(LibraryBookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public Page<LibraryBook> getAllBooks(int page, int size, String title, String category) {
        return bookRepository.findByFilters(title, category, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public LibraryBook getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
    }

    @Transactional
    public LibraryBook createBook(BookRequestDto dto) {
        LibraryBook book = new LibraryBook();
        book.setTitle(dto.getTitle());
        book.setAuthor(dto.getAuthor());
        book.setIsbn(dto.getIsbn());
        book.setCategory(dto.getCategory());
        book.setTotalCopies(dto.getTotalCopies());
        book.setAvailableCopies(dto.getTotalCopies());
        return bookRepository.save(book);
    }

    @Transactional
    public LibraryBook updateBook(Long id, BookRequestDto dto) {
        LibraryBook existing = getBookById(id);
        if (dto.getIsbn() != null) {
            Optional.ofNullable(bookRepository.findByIsbn(dto.getIsbn()).orElse(null))
                    .filter(b -> !b.getId().equals(id))
                    .ifPresent(b -> { throw new BusinessValidationException("ISBN already in use by another book: " + dto.getIsbn()); });
        }
        existing.setTitle(dto.getTitle());
        existing.setAuthor(dto.getAuthor());
        existing.setIsbn(dto.getIsbn());
        existing.setCategory(dto.getCategory());
        existing.setTotalCopies(dto.getTotalCopies());
        return bookRepository.save(existing);
    }

    @Transactional
    public void deleteBook(Long id) {
        getBookById(id);
        bookRepository.deleteById(id);
    }
}
