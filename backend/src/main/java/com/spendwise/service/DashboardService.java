package com.spendwise.service;

import com.spendwise.dto.DashboardSummary;
import com.spendwise.entity.User;
import com.spendwise.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private final ExpenseRepository expenseRepository;

    public DashboardService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary(User user, Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int targetYear = year == null ? now.getYear() : year;
        int targetMonth = month == null ? now.getMonthValue() : month;

        LocalDate monthStart = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        LocalDate yearStart = LocalDate.of(targetYear, 1, 1);
        LocalDate yearEnd = LocalDate.of(targetYear, 12, 31);

        BigDecimal totalThisMonth = nz(expenseRepository.sumBetween(user.getId(), monthStart, monthEnd));
        BigDecimal totalThisYear = nz(expenseRepository.sumBetween(user.getId(), yearStart, yearEnd));

        long daysInMonthSoFar;
        if (targetYear == now.getYear() && targetMonth == now.getMonthValue()) {
            daysInMonthSoFar = now.getDayOfMonth();
        } else {
            daysInMonthSoFar = monthStart.lengthOfMonth();
        }
        BigDecimal avgPerDay = totalThisMonth
                .divide(BigDecimal.valueOf(Math.max(1, daysInMonthSoFar)), 2, RoundingMode.HALF_UP);

        long txCount = expenseRepository.countByUserIdAndExpenseDateBetween(user.getId(), monthStart, monthEnd);

        // Category breakdown for the selected month
        List<Object[]> rows = expenseRepository.categoryBreakdown(user.getId(), monthStart, monthEnd);
        List<DashboardSummary.CategorySlice> slices = new ArrayList<>();
        BigDecimal grandTotal = totalThisMonth.signum() == 0 ? BigDecimal.ONE : totalThisMonth;

        for (Object[] row : rows) {
            String name = row[0] == null ? "Uncategorized" : (String) row[0];
            String color = row[1] == null ? "#8690A9" : (String) row[1];
            BigDecimal amount = nz((BigDecimal) row[2]);
            double pct = amount.multiply(BigDecimal.valueOf(100))
                    .divide(grandTotal, 1, RoundingMode.HALF_UP)
                    .doubleValue();
            slices.add(new DashboardSummary.CategorySlice(name, amount, color, pct));
        }

        DashboardSummary.TopCategory top = slices.isEmpty()
                ? null
                : new DashboardSummary.TopCategory(slices.get(0).name(), slices.get(0).amount(), slices.get(0).color());

        // Monthly trend: last 6 months up to the target month
        List<DashboardSummary.MonthPoint> trend = new ArrayList<>();
        LocalDate cursor = monthStart.minusMonths(5);
        for (int i = 0; i < 6; i++) {
            LocalDate start = cursor.withDayOfMonth(1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            BigDecimal sum = nz(expenseRepository.sumBetween(user.getId(), start, end));
            String label = Month.of(start.getMonthValue()).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trend.add(new DashboardSummary.MonthPoint(label, sum));
            cursor = cursor.plusMonths(1);
        }

        return new DashboardSummary(
                totalThisMonth,
                totalThisYear,
                avgPerDay,
                txCount,
                top,
                slices,
                trend
        );
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}