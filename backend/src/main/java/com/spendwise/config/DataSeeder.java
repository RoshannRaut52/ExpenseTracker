package com.spendwise.config;

import com.spendwise.entity.Category;
import com.spendwise.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public DataSeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.countByUserIdIsNull() > 0) {
            return; // already seeded
        }

        List<Category> defaults = List.of(
                seed("Food", "🍜", "#43E6A0"),
                seed("Travel", "✈️", "#79A9FF"),
                seed("Shopping", "◈", "#F47DC8"),
                seed("Bills", "▤", "#F6A623"),
                seed("Entertainment", "◉", "#A78BFA"),
                seed("Health", "✚", "#FF7676"),
                seed("Education", "▥", "#4FD1E3"),
                seed("Other", "···", "#8690A9")
        );

        categoryRepository.saveAll(defaults);
    }

    private Category seed(String name, String icon, String color) {
        return Category.builder()
                .name(name)
                .icon(icon)
                .color(color)
                .user(null)
                .isDefault(true)
                .build();
    }
}