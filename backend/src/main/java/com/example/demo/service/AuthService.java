package com.example.demo.service;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EntityManager entityManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, EntityManager entityManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.entityManager = entityManager;
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
        userRepository.delete(user);
        userRepository.flush();
        resequenceIds();
    }

    private void resequenceIds() {
        List<User> users = userRepository.findAll(org.springframework.data.domain.Sort.by("id"));
        entityManager.createNativeQuery("SET @count = 0").executeUpdate();
        entityManager.createNativeQuery("UPDATE users SET id = (@count := @count + 1) ORDER BY id").executeUpdate();
        entityManager.createNativeQuery("ALTER TABLE users AUTO_INCREMENT = 1").executeUpdate();
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
