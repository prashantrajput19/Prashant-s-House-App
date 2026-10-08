package com.examly.springapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.examly.springapp.exceptions.InvalidCredentialsException;
import com.examly.springapp.exceptions.InvalidRequestException;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepo;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@architectpoint.com}")
    private String masterEmail;

    @Value("${app.admin.password:Admin@123}")
    private String masterPassword;

    @Value("${app.admin.username:masteradmin}")
    private String masterUsername;

    @Value("${app.admin.mobile-number:9999999999}")
    private String masterMobile;

    @Override
    public User createUser(User user) {
        if (masterEmail.equalsIgnoreCase(user.getEmail())) {
            throw new InvalidRequestException("This email is reserved.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    @Override
    public User loginUser(User user) {
        createMasterAdminIfMissing(user.getEmail());

        return userRepo.findByEmail(user.getEmail())
                .filter(found -> passwordEncoder.matches(user.getPassword(), found.getPassword()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("User not found."));
    }

    @Override
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = getUserByEmail(email);

        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidRequestException("Your current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new InvalidRequestException("The new password must be at least 6 characters.");
        }
        if (newPassword.equals(currentPassword)) {
            throw new InvalidRequestException("The new password must be different from the current one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    @Override
    public User makeAdmin(Long userId) {
        User user = getUserById(userId);
        if ("Admin".equals(user.getUserRole())) {
            throw new InvalidRequestException(user.getUsername() + " is already an admin.");
        }
        user.setUserRole("Admin");
        return userRepo.save(user);
    }

    @Override
    public User removeAdmin(Long userId) {
        User user = getUserById(userId);
        if (user.isMasterAdmin()) {
            throw new InvalidRequestException("The master admin cannot be removed.");
        }
        if (!"Admin".equals(user.getUserRole())) {
            throw new InvalidRequestException(user.getUsername() + " is not an admin.");
        }
        user.setUserRole("User");
        return userRepo.save(user);
    }

    private User getUserById(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new InvalidRequestException("User with id " + userId + " does not exist."));
    }

    private void createMasterAdminIfMissing(String email) {
        if (!masterEmail.equalsIgnoreCase(email) || userRepo.findByEmail(masterEmail).isPresent()) {
            return;
        }

        User admin = new User();
        admin.setUsername(masterUsername);
        admin.setEmail(masterEmail);
        admin.setMobileNumber(masterMobile);
        admin.setPassword(passwordEncoder.encode(masterPassword));
        admin.setUserRole("Admin");
        admin.setMasterAdmin(true);
        userRepo.save(admin);
    }
}
