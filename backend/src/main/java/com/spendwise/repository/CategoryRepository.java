package com.spendwise.repository;

import com.spendwise.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.user IS NULL OR c.user.id = :userId ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findAllForUser(@Param("userId") Long userId);

    List<Category> findByUserId(Long userId);

    long countByUserIdIsNull();
}