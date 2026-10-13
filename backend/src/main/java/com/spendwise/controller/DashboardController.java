package com.spendwise.controller;

import com.spendwise.dto.DashboardSummary;
import com.spendwise.entity.User;
import com.spendwise.service.AuthService;
import com.spendwise.service.DashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public DashboardSummary summary(
            Authentication auth,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        User user = authService.requireUserByEmail(auth.getName());
        return dashboardService.summary(user, month, year);
    }
}