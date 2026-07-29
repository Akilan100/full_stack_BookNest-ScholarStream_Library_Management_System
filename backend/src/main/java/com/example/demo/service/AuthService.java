package com.example.demo.service;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.repository.BookHoldRequestRepository;
import com.example.demo.repository.BookIssueRecordRepository;
import com.example.demo.repository.FinePaymentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BookHoldRequestRepository holdRepository;
    private final BookIssueRecordRepository issueRepository;
    private final FinePaymentRepository fineRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       BookHoldRequestRepository holdRepository, BookIssueRecordRepository issueRepository,
                       FinePaymentRepository fineRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.holdRepository = holdRepository;
        this.issueRepository = issueRepository;
        this.fineRepository = fineRepository;
    }

    public AuthResponse register(AuthRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new BusinessValidationException("Email already registered");
        }
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName() != null ? req.getFullName() : req.getEmail());
        user.setRole(req.getRole() != null ? req.getRole() : "LIBRARY_PATRON");
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getRole(), user.getEmail(), user.getFullName(), user.getId());
    }

    @Transactional
    public void deleteByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessValidationException("User not found"));
        issueRepository.findByLibraryAccountId(user.getId()).forEach(issue ->
            fineRepository.findByBookIssueRecordId(issue.getId()).ifPresent(fineRepository::delete)
        );
        issueRepository.deleteAll(issueRepository.findByLibraryAccountId(user.getId()));
        holdRepository.deleteAll(holdRepository.findByLibraryAccountId(user.getId()));
        userRepository.delete(user);
    }

    public AuthResponse updateById(Long id, AuthRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessValidationException("User not found"));
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getRole() != null) user.setRole(req.getRole());
        if (req.getPassword() != null) user.setPassword(passwordEncoder.encode(req.getPassword()));
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getRole(), user.getEmail(), user.getFullName(), user.getId());
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessValidationException("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BusinessValidationException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getRole(), user.getEmail(), user.getFullName(), user.getId());
    }
}
