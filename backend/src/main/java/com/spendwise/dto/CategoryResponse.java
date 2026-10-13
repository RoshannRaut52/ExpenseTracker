package com.spendwise.dto;

public record CategoryResponse(
        Long id,
        String name,
        String icon,
        String color,
        Boolean isDefault
) {}