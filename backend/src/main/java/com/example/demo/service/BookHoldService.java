package com.example.demo.service;

import com.example.demo.dto.BookHoldMapper;
import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.BookIssueResponseDto;
import com.example.demo.dto.BookIssueMapper;
import com.example.demo.entity.*;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookHoldRequestRepository;
import com.example.demo.repository.BookIssueRecordRepository;
import com.example.demo.repository.LibraryBookRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookHoldService {

    private final BookHoldRequestRepository holdRepository;
    private final LibraryBookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookIssueRecordRepository issueRepository;

    public BookHoldService(BookHoldRequestRepository holdRepository,
                           LibraryBookRepository bookRepository,
                           UserRepository userRepository,
                           BookIssueRecordRepository issueRepository) {
        this.holdRepository = holdRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
    }

    @Transactional(readOnly = true)
    public List<BookHoldResponseDto> getAll() {
        return holdRepository.findAllWithDetails().stream().map(BookHoldMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<BookHoldResponseDto> getByAccountId(Long accountId) {
        return holdRepository.findByLibraryAccountIdWithDetails(accountId).stream().map(BookHoldMapper::toDto).toList();
    }

    @Transactional
    public BookHoldResponseDto placeHold(BookHoldRequestDto dto) {
        LibraryBook book = bookRepository.findById(dto.getLibraryBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + dto.getLibraryBookId()));
        User user = userRepository.findById(dto.getLibraryAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getLibraryAccountId()));

        BookHoldRequest hold = new BookHoldRequest();
        hold.setLibraryBook(book);
        hold.setLibraryAccount(user);
        hold.setRequestDate(dto.getRequestDate() != null ? dto.getRequestDate() : LocalDateTime.now());
        hold.setStatus(HoldStatus.PENDING);
        return BookHoldMapper.toDto(holdRepository.save(hold));
    }

    @Transactional
    public BookHoldResponseDto cancelHold(Long id, Long currentUserId) {
        BookHoldRequest hold = findById(id);
        if (!hold.getLibraryAccount().getId().equals(currentUserId)) {
            throw new BusinessValidationException("You can only cancel your own holds.");
        }
        if (hold.getStatus() == HoldStatus.FULFILLED || hold.getStatus() == HoldStatus.CANCELLED) {
            throw new BusinessValidationException("Hold cannot be cancelled in status: " + hold.getStatus());
        }
        hold.setStatus(HoldStatus.CANCELLED);
        return BookHoldMapper.toDto(holdRepository.save(hold));
    }

    @Transactional
    public BookHoldResponseDto adminCancelHold(Long id) {
        BookHoldRequest hold = findById(id);
        if (hold.getStatus() == HoldStatus.FULFILLED || hold.getStatus() == HoldStatus.CANCELLED) {
            throw new BusinessValidationException("Hold cannot be cancelled in status: " + hold.getStatus());
        }
        hold.setStatus(HoldStatus.CANCELLED);
        return BookHoldMapper.toDto(holdRepository.save(hold));
    }

    @Transactional
    public BookHoldResponseDto markReadyForPickup(Long id) {
        BookHoldRequest hold = findById(id);
        if (hold.getStatus() != HoldStatus.PENDING) {
            throw new BusinessValidationException("Hold must be PENDING to mark ready for pickup.");
        }
        hold.setStatus(HoldStatus.READY_FOR_PICKUP);
        return BookHoldMapper.toDto(holdRepository.save(hold));
    }

    @Transactional
    public BookIssueResponseDto fulfillHold(Long id) {
        BookHoldRequest hold = findById(id);
        if (hold.getStatus() != HoldStatus.READY_FOR_PICKUP) {
            throw new BusinessValidationException("Hold must be READY_FOR_PICKUP to fulfill. Current status: " + hold.getStatus());
        }
        LibraryBook book = hold.getLibraryBook();
        if (book.getAvailableCopies() < 1) {
            throw new BusinessValidationException("No available copies for book: " + book.getTitle());
        }
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        BookIssueRecord record = new BookIssueRecord();
        record.setLibraryBook(book);
        record.setLibraryAccount(hold.getLibraryAccount());
        record.setIssueDate(LocalDateTime.now());
        record.setDueDate(LocalDateTime.now().plusDays(14));
        record.setStatus(IssueStatus.ISSUED);
        record.setFineAmount(BigDecimal.ZERO);
        issueRepository.save(record);

        hold.setStatus(HoldStatus.FULFILLED);
        holdRepository.save(hold);

        return BookIssueMapper.toDto(record);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        holdRepository.deleteById(id);
    }

    private BookHoldRequest findById(Long id) {
        return holdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hold request not found with id: " + id));
    }
}
