package com.spendwise.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  public record AuthRequest(@Email @NotBlank String email, @NotBlank @Size(min = 6) String password) {}
  public record RegisterRequest(@Email @NotBlank String email, @NotBlank @Size(min = 6) String password, @NotBlank String fullName) {}

  @PostMapping("/login")
  public Map<String, Object> login(@Valid @RequestBody AuthRequest request) {
    return response(request.email(), request.email().split("@")[0]);
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
    return response(request.email(), request.fullName());
  }

  private Map<String, Object> response(String email, String fullName) {
    return Map.of("token", UUID.randomUUID().toString(), "user", Map.of("id", 1, "email", email, "fullName", fullName));
  }
}
