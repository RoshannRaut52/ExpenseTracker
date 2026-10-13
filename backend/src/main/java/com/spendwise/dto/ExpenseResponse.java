package com.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        BigDecimal amount,
        String description,
        Long categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColor,
        LocalDate expenseDate,
        LocalDateTime createdAt
) {}