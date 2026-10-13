package com.spendwise.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummary(
        BigDecimal totalThisMonth,
        BigDecimal totalThisYear,
        BigDecimal avgPerDay,
        long transactionCount,
        TopCategory topCategory,
        List<CategorySlice> categoryBreakdown,
        List<MonthPoint> monthlyTrend
) {
    public record TopCategory(String name, BigDecimal amount, String color) {}

    public record CategorySlice(String name, BigDecimal amount, String color, double percentage) {}

    public record MonthPoint(String month, BigDecimal amount) {}
}