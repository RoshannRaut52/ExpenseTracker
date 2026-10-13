package com.spendwise.controller;

import com.spendwise.dto.CategoryResponse;
import com.spendwise.entity.User;
import com.spendwise.service.AuthService;
import com.spendwise.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final AuthService authService;

    public CategoryController(CategoryService categoryService, AuthService authService) {
        this.categoryService = categoryService;
        this.authService = authService;
    }

    @GetMapping
    public List<CategoryResponse> list(Authentication auth) {
        User user = currentUser(auth);
        return categoryService.listForUser(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(Authentication auth, @RequestBody CategoryResponse req) {
        User user = currentUser(auth);
        return categoryService.create(user, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable Long id) {
        User user = currentUser(auth);
        categoryService.delete(user, id);
    }

    private User currentUser(Authentication auth) {
        return authService.requireUserByEmail(auth.getName());
    }
}