package com.spendwise.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
  @GetMapping("/summary")
  public Map<String, Object> summary(@RequestParam(required = false) Integer month, @RequestParam(required = false) Integer year) {
    return Map.of(
      "totalThisMonth", new BigDecimal("44260.00"),
      "totalThisYear", new BigDecimal("238450.00"),
      "avgPerDay", new BigDecimal("1428.00"),
      "transactionCount", 32,
      "topCategory", Map.of("name", "Food", "amount", new BigDecimal("15260.00"), "color", "#43E6A0"),
      "categoryBreakdown", List.of(Map.of("name", "Food", "amount", 15260, "color", "#43E6A0", "percentage", 34.5)),
      "monthlyTrend", List.of(Map.of("month", "Oct", "amount", 44260))
    );
  }
}
