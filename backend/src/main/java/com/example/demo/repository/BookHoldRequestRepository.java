package com.example.demo.repository;

import com.example.demo.entity.BookHoldRequest;
import com.example.demo.entity.HoldStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookHoldRequestRepository extends JpaRepository<BookHoldRequest, Long> {

    List<BookHoldRequest> findByLibraryAccountId(Long libraryAccountId);

    List<BookHoldRequest> findByLibraryBookId(Long libraryBookId);

    List<BookHoldRequest> findByStatus(HoldStatus status);

    List<BookHoldRequest> findByRequestDateBetween(LocalDateTime from, LocalDateTime to);
}
