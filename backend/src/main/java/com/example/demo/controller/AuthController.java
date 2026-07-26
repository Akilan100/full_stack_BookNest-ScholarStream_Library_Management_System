package com.example.demo.controller;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.UserResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuthService;
import com.example.demo.util.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(AuthService authService, UserRepository userRepository, JwtService jwtService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getEmail(), u.getPassword(), u.getFullName(), u.getRole(), jwtService.generateToken(u)))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    @DeleteMapping("/users/{email}")
    public ResponseEntity<Void> deleteUser(@PathVariable String email) {
        authService.deleteByEmail(email);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    @PutMapping("/users/{id}")
    public ResponseEntity<AuthResponse> updateUser(@PathVariable Long id, @RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.updateById(id, req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
