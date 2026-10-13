package com.spendwise.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
  private final List<Map<String, Object>> categories = new CopyOnWriteArrayList<>(List.of(
    Map.of("id", 1, "name", "Food", "icon", "🍜", "color", "#43E6A0", "isDefault", true),
    Map.of("id", 2, "name", "Travel", "icon", "✈️", "color", "#79A9FF", "isDefault", true),
    Map.of("id", 3, "name", "Shopping", "icon", "◈", "color", "#F47DC8", "isDefault", true),
    Map.of("id", 4, "name", "Bills", "icon", "▤", "color", "#F6A623", "isDefault", true),
    Map.of("id", 5, "name", "Entertainment", "icon", "◉", "color", "#A78BFA", "isDefault", true),
    Map.of("id", 6, "name", "Health", "icon", "✚", "color", "#FF7676", "isDefault", true),
    Map.of("id", 7, "name", "Education", "icon", "▥", "color", "#4FD1E3", "isDefault", true),
    Map.of("id", 8, "name", "Other", "icon", "···", "color", "#8690A9", "isDefault", true)
  ));

  @GetMapping public List<Map<String, Object>> list() { return categories; }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Map<String, Object> create(@RequestBody Map<String, Object> request) { var category = Map.<String, Object>of("id", System.currentTimeMillis(), "name", request.getOrDefault("name", "Other"), "icon", request.getOrDefault("icon", "✦"), "color", request.getOrDefault("color", "#43E6A0"), "isDefault", false); categories.add(category); return category; }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { categories.removeIf(item -> String.valueOf(item.get("id")).equals(String.valueOf(id)) && !Boolean.TRUE.equals(item.get("isDefault"))); }
}
