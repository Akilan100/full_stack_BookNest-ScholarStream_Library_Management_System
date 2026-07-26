package com.example.demo.dto;

import java.util.List;
import java.util.Map;

public class UserResponse {
    private Long id;
    private String email;
    private String password;
    private String fullName;
    private String role;
    private String token;
    private boolean enabled;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean credentialsNonExpired;
    private List<Map<String, String>> authorities;

    public UserResponse(Long id, String email, String password, String fullName, String role, String token) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
        this.enabled = true;
        this.accountNonExpired = true;
        this.accountNonLocked = true;
        this.credentialsNonExpired = true;
        this.authorities = List.of(Map.of("authority", "ROLE_" + role));
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getToken() { return token; }
    public boolean isEnabled() { return enabled; }
    public boolean isAccountNonExpired() { return accountNonExpired; }
    public boolean isAccountNonLocked() { return accountNonLocked; }
    public boolean isCredentialsNonExpired() { return credentialsNonExpired; }
    public List<Map<String, String>> getAuthorities() { return authorities; }
}
