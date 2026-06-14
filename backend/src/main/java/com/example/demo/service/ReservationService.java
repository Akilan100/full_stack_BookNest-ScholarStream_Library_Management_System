package com.example.demo.service;

import com.example.demo.entity.Reservation;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    public Reservation createReservation(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    public Reservation updateReservation(Long id, Reservation updated) {
        Reservation existing = getReservationById(id);
        existing.setReservedBy(updated.getReservedBy());
        existing.setReservationDate(updated.getReservationDate());
        existing.setBook(updated.getBook());
        return reservationRepository.save(existing);
    }

    public void deleteReservation(Long id) {
        getReservationById(id);
        reservationRepository.deleteById(id);
    }
}
