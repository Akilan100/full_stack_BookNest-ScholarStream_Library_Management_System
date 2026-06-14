package com.example.demo.repository;

import com.example.demo.entity.BookHoldRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookHoldRequestRepository extends JpaRepository<BookHoldRequest, Long> {
}
