package com.example.demo.service;

import com.example.demo.dto.ReservationRequestDto;
import com.example.demo.entity.BookHoldRequest;
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

    public ReservationService(BookHoldRequestRepository bookHoldRequestRepository) {
        this.bookHoldRequestRepository = bookHoldRequestRepository;
        this.userRepository = null;
        this.libraryBookRepository = null;
    }

    public ReservationService(BookHoldRequestRepository bookHoldRequestRepository,
                              UserRepository userRepository,
                              LibraryBookRepository libraryBookRepository) {
        this.bookHoldRequestRepository = bookHoldRequestRepository;
        this.userRepository = userRepository;
        this.libraryBookRepository = libraryBookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookHoldRequest> getAllReservations() {
        return bookHoldRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public BookHoldRequest getReservationById(Long id) {
        return bookHoldRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    @Transactional
    public BookHoldRequest createReservation(ReservationRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        LibraryBook book = libraryBookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + dto.getBookId()));
        BookHoldRequest request = new BookHoldRequest();
        request.setUsername(user.getEmail());
        request.setBook(book);
        return bookHoldRequestRepository.save(request);
    }

    @Transactional
    public void deleteReservation(Long id) {
        getReservationById(id);
        bookHoldRequestRepository.deleteById(id);
    }
}
