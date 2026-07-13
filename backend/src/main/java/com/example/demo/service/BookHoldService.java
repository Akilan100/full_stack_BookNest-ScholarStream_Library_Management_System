package com.example.demo.service;

import com.example.demo.dto.BookHoldMapper;
import com.example.demo.dto.BookHoldRequestDto;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.entity.BookHoldRequest;
import com.example.demo.entity.HoldStatus;
import com.example.demo.entity.LibraryBook;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookHoldRequestRepository;
import com.example.demo.repository.LibraryBookRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookHoldService {

    private final BookHoldRequestRepository holdRepository;
    private final LibraryBookRepository bookRepository;
    private final UserRepository userRepository;

    public BookHoldService(BookHoldRequestRepository holdRepository,
                           LibraryBookRepository bookRepository,
                           UserRepository userRepository) {
        this.holdRepository = holdRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<BookHoldResponseDto> getAll() {
        return holdRepository.findAll().stream().map(BookHoldMapper::toDto).toList();
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
    public BookHoldResponseDto cancelHold(Long id) {
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
    public void delete(Long id) {
        findById(id);
        holdRepository.deleteById(id);
    }

    private BookHoldRequest findById(Long id) {
        return holdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hold request not found with id: " + id));
    }
}
