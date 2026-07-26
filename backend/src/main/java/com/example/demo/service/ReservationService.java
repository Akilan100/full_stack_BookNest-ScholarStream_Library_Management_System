package com.example.demo.service;

import com.example.demo.dto.BookHoldMapper;
import com.example.demo.dto.BookHoldResponseDto;
import com.example.demo.dto.ReservationRequestDto;
import com.example.demo.entity.BookHoldRequest;
import com.example.demo.entity.HoldStatus;
import com.example.demo.entity.LibraryBook;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookHoldRequestRepository;
import com.example.demo.repository.LibraryBookRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservationService {

    private final BookHoldRequestRepository bookHoldRequestRepository;
    private final UserRepository userRepository;
    private final LibraryBookRepository libraryBookRepository;

    public ReservationService(BookHoldRequestRepository bookHoldRequestRepository,
                              UserRepository userRepository,
                              LibraryBookRepository libraryBookRepository) {
        this.bookHoldRequestRepository = bookHoldRequestRepository;
        this.userRepository = userRepository;
        this.libraryBookRepository = libraryBookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookHoldResponseDto> getAllReservations() {
        return bookHoldRequestRepository.findAllWithDetails().stream().map(BookHoldMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BookHoldResponseDto getReservationById(Long id) {
        BookHoldRequest r = bookHoldRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        return BookHoldMapper.toDto(r);
    }

    @Transactional
    public BookHoldResponseDto createReservation(ReservationRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        LibraryBook book = libraryBookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + dto.getBookId()));
        BookHoldRequest request = new BookHoldRequest();
        request.setLibraryAccount(user);
        request.setLibraryBook(book);
        request.setRequestDate(java.time.LocalDateTime.now());
        request.setStatus(HoldStatus.PENDING);
        return BookHoldMapper.toDto(bookHoldRequestRepository.save(request));
    }

    @Transactional
    public void deleteReservation(Long id) {
        bookHoldRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        bookHoldRequestRepository.deleteById(id);
    }
}
