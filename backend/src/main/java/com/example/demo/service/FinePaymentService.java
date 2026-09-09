package com.example.demo.service;

import com.example.demo.dto.FinePaymentMapper;
import com.example.demo.dto.FinePaymentRequestDto;
import com.example.demo.dto.FinePaymentResponseDto;
import com.example.demo.entity.BookIssueRecord;
import com.example.demo.entity.FinePayment;
import com.example.demo.entity.PaymentStatus;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookIssueRecordRepository;
import com.example.demo.repository.FinePaymentRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FinePaymentService {

    private final FinePaymentRepository fineRepository;
    private final BookIssueRecordRepository issueRepository;
    private final UserRepository userRepository;

    public FinePaymentService(FinePaymentRepository fineRepository,
                              BookIssueRecordRepository issueRepository,
                              UserRepository userRepository) {
        this.fineRepository = fineRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FinePaymentResponseDto> getAll() {
        return fineRepository.findAll().stream().map(FinePaymentMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<FinePaymentResponseDto> getByAccountId(Long accountId) {
        return fineRepository.findByLibraryAccountId(accountId).stream().map(FinePaymentMapper::toDto).toList();
    }

    @Transactional
    public FinePaymentResponseDto createFine(FinePaymentRequestDto dto) {
        BookIssueRecord record = issueRepository.findById(dto.getBookIssueRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found with id: " + dto.getBookIssueRecordId()));
        User user = userRepository.findById(dto.getLibraryAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getLibraryAccountId()));

        if (fineRepository.findByBookIssueRecordId(dto.getBookIssueRecordId()).isPresent()) {
            throw new BusinessValidationException("Fine already exists for issue record id: " + dto.getBookIssueRecordId());
        }

        FinePayment payment = new FinePayment();
        payment.setBookIssueRecord(record);
        payment.setLibraryAccount(user);
        payment.setAmount(dto.getAmount());
        payment.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDateTime.now());
        payment.setPaymentStatus(PaymentStatus.PENDING);
        return FinePaymentMapper.toDto(fineRepository.save(payment));
    }

    @Transactional
    public FinePaymentResponseDto payFine(Long id) {
        FinePayment payment = findById(id);
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessValidationException("Fine already paid for id: " + id);
        }
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaymentDate(LocalDateTime.now());
        return FinePaymentMapper.toDto(fineRepository.save(payment));
    }

    @Transactional
    public FinePaymentResponseDto waiveFine(Long id) {
        FinePayment payment = findById(id);
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessValidationException("Cannot waive an already paid fine.");
        }
        payment.setPaymentStatus(PaymentStatus.WAIVED);
        return FinePaymentMapper.toDto(fineRepository.save(payment));
    }

    private FinePayment findById(Long id) {
        return fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fine payment not found with id: " + id));
    }
}
