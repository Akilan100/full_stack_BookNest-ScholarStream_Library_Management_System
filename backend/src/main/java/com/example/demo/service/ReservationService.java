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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservationService {

    private final BookHoldRequestRepository bookHoldRequestRepository;

    @Autowired
    private ApplicationContext applicationContext;

    public ReservationService(BookHoldRequestRepository bookHoldRequestRepository) {
        this.bookHoldRequestRepository = bookHoldRequestRepository;
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
        com.example.demo.repository.UserRepository userRepository =
                applicationContext.getBean(com.example.demo.repository.UserRepository.class);
        com.example.demo.repository.LibraryBookRepository libraryBookRepository =
                applicationContext.getBean(com.example.demo.repository.LibraryBookRepository.class);

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
