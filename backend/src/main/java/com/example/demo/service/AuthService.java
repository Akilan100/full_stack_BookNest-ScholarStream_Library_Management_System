package com.example.demo.service;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

    public void deleteByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessValidationException("User not found"));
        userRepository.delete(user);
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
