package com.example.demo.service;

import com.example.demo.entity.LibraryBook;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.LibraryBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class BookService {

    private final LibraryBookRepository bookRepository;

    @Transactional(readOnly = true)
    public List<LibraryBook> getAllBooks() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public LibraryBook getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
    }

    public LibraryBook createBook(LibraryBook book) {
        return bookRepository.save(book);
    }

    public LibraryBook updateBook(Long id, LibraryBook updated) {
        LibraryBook existing = getBookById(id);
        existing.setTitle(updated.getTitle());
        existing.setAuthor(updated.getAuthor());
        existing.setIsbn(updated.getIsbn());
        return bookRepository.save(existing);
    }

    public void deleteBook(Long id) {
        getBookById(id);
        bookRepository.deleteById(id);
    }
}
