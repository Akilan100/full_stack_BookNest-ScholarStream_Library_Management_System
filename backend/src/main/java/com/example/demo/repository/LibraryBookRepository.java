package com.example.demo.repository;

import com.example.demo.entity.LibraryBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {

    Optional<LibraryBook> findByTitle(String title);

    @Query("SELECT b FROM LibraryBook b WHERE b.author = :author")
    List<LibraryBook> findAllByAuthor(@Param("author") String author);

    @Query("SELECT b FROM LibraryBook b WHERE (:title IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND (:category IS NULL OR b.category = :category)")
    Page<LibraryBook> findByFilters(@Param("title") String title, @Param("category") String category, Pageable pageable);
}
