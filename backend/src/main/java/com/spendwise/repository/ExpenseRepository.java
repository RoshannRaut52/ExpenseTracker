package com.spendwise.repository;

import com.spendwise.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserIdOrderByExpenseDateDesc(Long userId);

    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    @Query("""
        SELECT e FROM Expense e
        WHERE e.user.id = :userId
          AND (:from IS NULL OR e.expenseDate >= :from)
          AND (:to IS NULL OR e.expenseDate <= :to)
          AND (:categoryId IS NULL OR e.category.id = :categoryId)
        ORDER BY e.expenseDate DESC, e.id DESC
    """)
    List<Expense> search(
        @Param("userId") Long userId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("categoryId") Long categoryId
    );

    @Query("""
        SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
        WHERE e.user.id = :userId
          AND e.expenseDate BETWEEN :from AND :to
    """)
    BigDecimal sumBetween(
        @Param("userId") Long userId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT e.category.name, e.category.color, COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.user.id = :userId
          AND e.expenseDate BETWEEN :from AND :to
        GROUP BY e.category.name, e.category.color
        ORDER BY SUM(e.amount) DESC
    """)
    List<Object[]> categoryBreakdown(
        @Param("userId") Long userId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    long countByUserIdAndExpenseDateBetween(Long userId, LocalDate from, LocalDate to);
}