package com.example.demo.service;

import com.example.demo.entity.BookHoldRequest;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookHoldRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservationService {

    private final BookHoldRequestRepository bookHoldRequestRepository;

    public ReservationService(BookHoldRequestRepository bookHoldRequestRepository) {
        this.bookHoldRequestRepository = bookHoldRequestRepository;
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
    public BookHoldRequest createReservation(BookHoldRequest request) {
        return bookHoldRequestRepository.save(request);
    }

    @Transactional
    public void deleteReservation(Long id) {
        getReservationById(id);
        bookHoldRequestRepository.deleteById(id);
    }
}
