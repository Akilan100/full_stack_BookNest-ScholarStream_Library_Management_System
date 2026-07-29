package com.example.demo.dto;

import java.util.List;
import java.util.Map;

public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String token;

    public UserResponse(Long id, String email, String password, String fullName, String role, String token) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getToken() { return token; }
}
