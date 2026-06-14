package com.example.demo.dto;

public class AuthResponse {
    private String token;
    private String role;
    private String email;
    private String fullName;
    private Long accountId;

    public AuthResponse(String token, String role, String email, String fullName, Long accountId) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.fullName = fullName;
        this.accountId = accountId;
    }

    public String getToken() { return token; }
    public String getRole() { return role; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public Long getAccountId() { return accountId; }
}
