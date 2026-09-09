package com.example.demo.service;

import com.example.demo.dto.BookIssueMapper;
import com.example.demo.dto.BookIssueRequestDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.entity.*;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookIssueRecordRepository;
import com.example.demo.repository.FinePaymentRepository;
import com.example.demo.repository.LibraryBookRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookIssueService {

    private static final BigDecimal FINE_PER_DAY = new BigDecimal("1.00");
    private static final BigDecimal LOST_BOOK_FINE = new BigDecimal("25.00");
    private static final int DEFAULT_LOAN_DAYS = 14;

    private final BookIssueRecordRepository issueRepository;
    private final LibraryBookRepository bookRepository;
    private final UserRepository userRepository;
    private final FinePaymentRepository fineRepository;

    public BookIssueService(BookIssueRecordRepository issueRepository,
                            LibraryBookRepository bookRepository,
                            UserRepository userRepository,
                            FinePaymentRepository fineRepository) {
        this.issueRepository = issueRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.fineRepository = fineRepository;
    }

    private void syncOverdueState(BookIssueRecord record) {
        if (record == null) return;
        if (record.getStatus() == IssueStatus.ISSUED && record.getDueDate() != null && LocalDateTime.now().isAfter(record.getDueDate())) {
            record.setStatus(IssueStatus.OVERDUE);
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate().toLocalDate(), LocalDate.now());
            if (overdueDays < 1) {
                overdueDays = 1;
            }
            BigDecimal fine = FINE_PER_DAY.multiply(BigDecimal.valueOf(overdueDays));
            record.setFineAmount(fine);
            issueRepository.save(record);

            FinePayment payment = fineRepository.findByBookIssueRecordId(record.getId()).orElse(new FinePayment());
            payment.setBookIssueRecord(record);
            payment.setLibraryAccount(record.getLibraryAccount());
            payment.setAmount(fine);
            if (payment.getPaymentDate() == null) {
                payment.setPaymentDate(LocalDateTime.now());
            }
            if (payment.getPaymentStatus() == null) {
                payment.setPaymentStatus(PaymentStatus.PENDING);
            }
            fineRepository.save(payment);
        }
    }

    @Transactional
    public List<BookIssueResponseDto> getAll() {
        List<BookIssueRecord> records = issueRepository.findAll();
        records.forEach(this::syncOverdueState);
        return records.stream().map(BookIssueMapper::toDto).toList();
    }

    @Transactional
    public BookIssueResponseDto getById(Long id) {
        BookIssueRecord record = findById(id);
        syncOverdueState(record);
        return BookIssueMapper.toDto(record);
    }

    @Transactional
    public List<BookIssueResponseDto> getByAccountId(Long accountId) {
        List<BookIssueRecord> records = issueRepository.findByLibraryAccountId(accountId);
        records.forEach(this::syncOverdueState);
        return records.stream().map(BookIssueMapper::toDto).toList();
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
        BookIssueRecord saved = issueRepository.save(record);

        // If explicitly issued with past due date, immediately sync overdue state
        syncOverdueState(saved);

        return BookIssueMapper.toDto(saved);
    }

    @Transactional
    public BookIssueResponseDto returnBook(Long id) {
        BookIssueRecord record = findById(id);
        if (record.getStatus() == IssueStatus.RETURNED) {
            throw new BusinessValidationException("Book already returned for issue id: " + id);
        }
        LocalDateTime now = LocalDateTime.now();
        record.setReturnDate(now);
        record.setStatus(IssueStatus.RETURNED);

        if (record.getDueDate() != null && record.getReturnDate().isAfter(record.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate().toLocalDate(), record.getReturnDate().toLocalDate());
            if (overdueDays < 1) {
                overdueDays = 1;
            }
            BigDecimal fine = FINE_PER_DAY.multiply(BigDecimal.valueOf(overdueDays));
            record.setFineAmount(fine);

            FinePayment payment = fineRepository.findByBookIssueRecordId(record.getId()).orElse(new FinePayment());
            payment.setBookIssueRecord(record);
            payment.setLibraryAccount(record.getLibraryAccount());
            payment.setAmount(fine);
            if (payment.getPaymentDate() == null) {
                payment.setPaymentDate(now);
            }
            if (payment.getPaymentStatus() == null) {
                payment.setPaymentStatus(PaymentStatus.PENDING);
            }
            fineRepository.save(payment);
        }

        LibraryBook book = record.getLibraryBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        issueRepository.save(record);
        return BookIssueMapper.toDto(record);
    }

    @Transactional
    public BookIssueResponseDto markLost(Long id) {
        BookIssueRecord record = findById(id);
        if (record.getStatus() == IssueStatus.RETURNED) {
            throw new BusinessValidationException("Cannot mark returned book as lost.");
        }
        record.setStatus(IssueStatus.LOST);

        // Assess replacement fine of $25.00 (+ any overdue accrued fine)
        BigDecimal fine = LOST_BOOK_FINE;
        if (record.getDueDate() != null && LocalDateTime.now().isAfter(record.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate().toLocalDate(), LocalDate.now());
            if (overdueDays > 0) {
                fine = fine.add(FINE_PER_DAY.multiply(BigDecimal.valueOf(overdueDays)));
            }
        }
        record.setFineAmount(fine);

        FinePayment payment = fineRepository.findByBookIssueRecordId(record.getId()).orElse(new FinePayment());
        payment.setBookIssueRecord(record);
        payment.setLibraryAccount(record.getLibraryAccount());
        payment.setAmount(fine);
        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(LocalDateTime.now());
        }
        if (payment.getPaymentStatus() == null) {
            payment.setPaymentStatus(PaymentStatus.PENDING);
        }
        fineRepository.save(payment);

        issueRepository.save(record);
        return BookIssueMapper.toDto(record);
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
