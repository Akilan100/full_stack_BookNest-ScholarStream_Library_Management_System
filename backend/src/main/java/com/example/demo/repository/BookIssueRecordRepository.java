package com.example.demo.repository;

import com.example.demo.entity.BookIssueRecord;
import com.example.demo.entity.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookIssueRecordRepository extends JpaRepository<BookIssueRecord, Long> {

    List<BookIssueRecord> findByLibraryAccountId(Long libraryAccountId);

    List<BookIssueRecord> findByLibraryBookId(Long libraryBookId);

    List<BookIssueRecord> findByStatus(IssueStatus status);

    List<BookIssueRecord> findByDueDateBefore(LocalDateTime dateTime);

    List<BookIssueRecord> findByReturnDateIsNull();

    List<BookIssueRecord> findByLibraryAccountEmail(String email);

    long countByStatus(IssueStatus status);
}
