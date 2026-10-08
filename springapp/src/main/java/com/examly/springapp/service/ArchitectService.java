package com.examly.springapp.service;

import java.util.List;

import com.examly.springapp.model.Architect;
import com.examly.springapp.model.TopArchitect;

public interface ArchitectService {
    Architect addArchitect(Architect architect);

    Architect updateArchitect(Long architectId, Architect updatedArchitect);

    Architect getArchitectById(Long architectId);

    List<Architect> getAllArchitects();

    void deleteArchitect(Long architectId);

    List<TopArchitect> getTopRated(int limit);
}
