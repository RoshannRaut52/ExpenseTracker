package com.spendwise.service;

import com.spendwise.dto.ExpenseRequest;
import com.spendwise.dto.ExpenseResponse;
import com.spendwise.entity.Category;
import com.spendwise.entity.Expense;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryService categoryService;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryService categoryService) {
        this.expenseRepository = expenseRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(User user, LocalDate from, LocalDate to, Long categoryId) {
        return expenseRepository.search(user.getId(), from, to, categoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ExpenseResponse create(User user, ExpenseRequest req) {
        Category category = categoryService.resolveForUser(user.getId(), req.categoryId());

        Expense expense = Expense.builder()
                .amount(req.amount())
                .description(req.description() == null ? "" : req.description().trim())
                .category(category)
                .user(user)
                .expenseDate(req.expenseDate())
                .build();

        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(User user, Long id, ExpenseRequest req) {
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> ApiException.notFound("Expense not found"));

        Category category = categoryService.resolveForUser(user.getId(), req.categoryId());

        expense.setAmount(req.amount());
        expense.setDescription(req.description() == null ? "" : req.description().trim());
        expense.setCategory(category);
        expense.setExpenseDate(req.expenseDate());

        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(User user, Long id) {
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> ApiException.notFound("Expense not found"));
        expenseRepository.delete(expense);
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getAmount(),
                e.getDescription(),
                e.getCategory() == null ? null : e.getCategory().getId(),
                e.getCategory() == null ? "Uncategorized" : e.getCategory().getName(),
                e.getCategory() == null ? "···" : e.getCategory().getIcon(),
                e.getCategory() == null ? "#8690A9" : e.getCategory().getColor(),
                e.getExpenseDate(),
                e.getCreatedAt()
        );
    }
}