package com.example.demo.repository;

import com.example.demo.entity.FinePayment;
import com.example.demo.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinePaymentRepository extends JpaRepository<FinePayment, Long> {

    List<FinePayment> findByLibraryAccountId(Long libraryAccountId);

    List<FinePayment> findByPaymentStatus(PaymentStatus paymentStatus);

    Optional<FinePayment> findByBookIssueRecordId(Long bookIssueRecordId);
}
