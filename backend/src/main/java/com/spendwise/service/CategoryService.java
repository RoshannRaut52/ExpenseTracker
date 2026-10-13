package com.spendwise.service;

import com.spendwise.dto.CategoryResponse;
import com.spendwise.entity.Category;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listForUser(Long userId) {
        return categoryRepository.findAllForUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse create(User user, CategoryResponse req) {
        if (req.name() == null || req.name().isBlank()) {
            throw ApiException.badRequest("Category name is required");
        }

        Category category = Category.builder()
                .name(req.name().trim())
                .icon(req.icon() == null ? "✦" : req.icon())
                .color(req.color() == null ? "#43E6A0" : req.color())
                .user(user)
                .isDefault(false)
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(User user, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> ApiException.notFound("Category not found"));

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw ApiException.badRequest("Default categories cannot be deleted");
        }
        if (category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            throw ApiException.unauthorized("You can only delete your own categories");
        }

        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public Category resolveForUser(Long userId, Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .filter(c -> c.getUser() == null || c.getUser().getId().equals(userId))
                .orElse(null);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getIcon(), c.getColor(), c.getIsDefault());
    }
}