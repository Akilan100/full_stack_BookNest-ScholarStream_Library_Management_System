package com.example.demo.dto;

public class AuthRequest {
    private String email;
    private String username;
    private String password;
    private String fullName;
    private String role;

    public String getEmail() { 
        return email != null ? email : username; 
    }
    public void setEmail(String email) { 
        this.email = email; 
        if (this.username == null) this.username = email;
    }

    public String getUsername() { 
        return username != null ? username : email; 
    }
    public void setUsername(String username) { 
        this.username = username; 
        if (this.email == null) this.email = username;
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
