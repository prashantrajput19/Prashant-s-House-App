package com.examly.springapp.exceptions;

public class ArchitectException extends ResourceNotFoundException {
    public ArchitectException(String message) {
        super(message);
    }
}
