package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "book_hold_request")
public class BookHoldRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @ManyToOne
    @JoinColumn(name = "book_id")
    private LibraryBook book;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public LibraryBook getBook() { return book; }
    public void setBook(LibraryBook book) { this.book = book; }
}
