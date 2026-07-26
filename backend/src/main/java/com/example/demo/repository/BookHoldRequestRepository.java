package com.example.demo.repository;

import com.example.demo.entity.BookHoldRequest;
import com.example.demo.entity.HoldStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookHoldRequestRepository extends JpaRepository<BookHoldRequest, Long> {

    List<BookHoldRequest> findByLibraryAccountId(Long libraryAccountId);

    List<BookHoldRequest> findByLibraryBookId(Long libraryBookId);

    List<BookHoldRequest> findByStatus(HoldStatus status);

    List<BookHoldRequest> findByRequestDateBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT h FROM BookHoldRequest h JOIN FETCH h.libraryBook JOIN FETCH h.libraryAccount")
    List<BookHoldRequest> findAllWithDetails();

    @Query("SELECT h FROM BookHoldRequest h JOIN FETCH h.libraryBook JOIN FETCH h.libraryAccount WHERE h.id = :id")
    Optional<BookHoldRequest> findByIdWithDetails(@Param("id") Long id);
}
