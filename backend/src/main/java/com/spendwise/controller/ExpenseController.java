package com.spendwise.controller;

import com.spendwise.dto.ExpenseRequest;
import com.spendwise.dto.ExpenseResponse;
import com.spendwise.entity.User;
import com.spendwise.service.AuthService;
import com.spendwise.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;

    public ExpenseController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService;
        this.authService = authService;
    }

    @GetMapping
    public List<ExpenseResponse> list(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long categoryId
    ) {
        User user = currentUser(auth);
        return expenseService.list(user, from, to, categoryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(Authentication auth, @Valid @RequestBody ExpenseRequest req) {
        User user = currentUser(auth);
        return expenseService.create(user, req);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest req
    ) {
        User user = currentUser(auth);
        return expenseService.update(user, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable Long id) {
        User user = currentUser(auth);
        expenseService.delete(user, id);
    }

    private User currentUser(Authentication auth) {
        return authService.requireUserByEmail(auth.getName());
    }
}