package com.example.demo.service;

import com.example.demo.dto.BookIssueMapper;
import com.example.demo.dto.BookIssueRequestDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.entity.*;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookIssueRecordRepository;
import com.example.demo.repository.LibraryBookRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookIssueService {

    private static final BigDecimal FINE_PER_DAY = new BigDecimal("1.00");
    private static final int DEFAULT_LOAN_DAYS = 14;

    private final BookIssueRecordRepository issueRepository;
    private final LibraryBookRepository bookRepository;
    private final UserRepository userRepository;

    public BookIssueService(BookIssueRecordRepository issueRepository,
                            LibraryBookRepository bookRepository,
                            UserRepository userRepository) {
        this.issueRepository = issueRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<BookIssueResponseDto> getAll() {
        return issueRepository.findAll().stream().map(BookIssueMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BookIssueResponseDto getById(Long id) {
        return BookIssueMapper.toDto(findById(id));
    }

    @Transactional
    public BookIssueResponseDto issueBook(BookIssueRequestDto dto) {
        LibraryBook book = bookRepository.findById(dto.getLibraryBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + dto.getLibraryBookId()));
        if (book.getAvailableCopies() < 1) {
            throw new BusinessValidationException("No available copies for book: " + book.getTitle());
        }
        User user = userRepository.findById(dto.getLibraryAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getLibraryAccountId()));

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        BookIssueRecord record = new BookIssueRecord();
        record.setLibraryBook(book);
        record.setLibraryAccount(user);
        record.setIssueDate(LocalDateTime.now());
        record.setDueDate(dto.getDueDate() != null ? dto.getDueDate() : LocalDateTime.now().plusDays(DEFAULT_LOAN_DAYS));
        record.setStatus(IssueStatus.ISSUED);
        record.setFineAmount(BigDecimal.ZERO);
        return BookIssueMapper.toDto(issueRepository.save(record));
    }

    @Transactional
    public BookIssueResponseDto returnBook(Long id) {
        BookIssueRecord record = findById(id);
        if (record.getStatus() == IssueStatus.RETURNED) {
            throw new BusinessValidationException("Book already returned for issue id: " + id);
        }
        record.setReturnDate(LocalDateTime.now());
        record.setStatus(IssueStatus.RETURNED);

        if (record.getReturnDate().isAfter(record.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate(), record.getReturnDate());
            record.setFineAmount(FINE_PER_DAY.multiply(BigDecimal.valueOf(overdueDays)));
        }

        LibraryBook book = record.getLibraryBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        return BookIssueMapper.toDto(issueRepository.save(record));
    }

    @Transactional
    public BookIssueResponseDto markLost(Long id) {
        BookIssueRecord record = findById(id);
        if (record.getStatus() == IssueStatus.RETURNED) {
            throw new BusinessValidationException("Cannot mark returned book as lost.");
        }
        record.setStatus(IssueStatus.LOST);
        return BookIssueMapper.toDto(issueRepository.save(record));
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        issueRepository.deleteById(id);
    }

    private BookIssueRecord findById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found with id: " + id));
    }
}
