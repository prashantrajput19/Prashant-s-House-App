package com.examly.springapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.examly.springapp.dto.UserResponse;
import com.examly.springapp.service.UserService;

@RestController
@RequestMapping("/api/admin/users")
public class AdminController {
    @Autowired
    private UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(UserResponse::from).toList();
    }

    @PutMapping("/{userId}/make-admin")
    public UserResponse makeAdmin(@PathVariable Long userId) {
        return UserResponse.from(userService.makeAdmin(userId));
    }

    @PutMapping("/{userId}/remove-admin")
    public UserResponse removeAdmin(@PathVariable Long userId) {
        return UserResponse.from(userService.removeAdmin(userId));
    }
}
