package com.example.demo.repository;

import com.example.demo.entity.LibraryBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {

    Optional<LibraryBook> findByTitle(String title);

    @Query("SELECT b FROM LibraryBook b WHERE b.author = :author")
    List<LibraryBook> findAllByAuthor(@Param("author") String author);
}
