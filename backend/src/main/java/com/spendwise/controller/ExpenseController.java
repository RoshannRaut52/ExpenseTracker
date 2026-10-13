package com.spendwise.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
  private final List<Map<String, Object>> expenses = new CopyOnWriteArrayList<>();

  public ExpenseController() {
    expenses.add(Map.of("id", 1, "amount", new BigDecimal("840.00"), "description", "Dinner at Mizu", "categoryId", 1, "expenseDate", LocalDate.of(2026, 10, 12)));
    expenses.add(Map.of("id", 2, "amount", new BigDecimal("3200.00"), "description", "Flight to Goa", "categoryId", 2, "expenseDate", LocalDate.of(2026, 10, 10)));
  }

  @GetMapping public List<Map<String, Object>> list() { return expenses; }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Map<String, Object> create(@RequestBody Map<String, Object> request) { var item = Map.<String, Object>of("id", System.currentTimeMillis(), "amount", request.getOrDefault("amount", 0), "description", request.getOrDefault("description", ""), "categoryId", request.getOrDefault("categoryId", 8), "expenseDate", request.getOrDefault("expenseDate", LocalDate.now().toString())); expenses.add(0, item); return item; }
  @PutMapping("/{id}") public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> request) { return create(request); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { expenses.removeIf(item -> String.valueOf(item.get("id")).equals(String.valueOf(id))); }
}
