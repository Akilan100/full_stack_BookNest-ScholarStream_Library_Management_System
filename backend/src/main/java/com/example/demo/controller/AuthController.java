package com.example.demo.controller;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @DeleteMapping("/users/{email}")
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String email) {
        authService.deleteByEmail(email);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('CHIEF_LIBRARIAN')")
    public ResponseEntity<AuthResponse> updateUser(@PathVariable Long id, @RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.updateById(id, req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
