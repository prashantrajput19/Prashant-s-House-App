package com.examly.springapp.service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.examly.springapp.exceptions.ArchitectException;
import com.examly.springapp.model.Architect;
import com.examly.springapp.model.Feedback;
import com.examly.springapp.model.TopArchitect;
import com.examly.springapp.repository.ArchitectRepo;
import com.examly.springapp.repository.FeedbackRepo;

@Service
public class ArchitectServiceImpl implements ArchitectService {
    @Autowired
    private ArchitectRepo architectRepo;

    @Autowired
    private FeedbackRepo feedbackRepo;

    @Override
    public Architect addArchitect(Architect architect) {
        return architectRepo.save(architect);
    }

    @Override
    public Architect updateArchitect(Long architectId, Architect updatedArchitect) {
        Architect existing = getArchitectById(architectId);

        existing.setName(updatedArchitect.getName());
        existing.setExpertise(updatedArchitect.getExpertise());
        existing.setLocation(updatedArchitect.getLocation());
        existing.setRating(updatedArchitect.getRating());
        existing.setPortfolioLink(updatedArchitect.getPortfolioLink());
        existing.setStatus(updatedArchitect.getStatus());

        return architectRepo.save(existing);
    }

    @Override
    public Architect getArchitectById(Long architectId) {
        return architectRepo.findById(architectId)
                .orElseThrow(() -> new ArchitectException(
                        "Architect with id " + architectId + " does not exist."));
    }

    @Override
    public List<Architect> getAllArchitects() {
        return architectRepo.findByDeletedFalse();
    }

    @Override
    public void deleteArchitect(Long architectId) {
        Architect architect = getArchitectById(architectId);
        architect.setDeleted(true);
        architectRepo.save(architect);
    }

    @Override
    public List<TopArchitect> getTopRated(int limit) {
        return getAllArchitects().stream()
                .filter(architect -> "Active".equals(architect.getStatus()))
                .map(this::score)
                .sorted(Comparator.comparingDouble(TopArchitect::getScore).reversed())
                .limit(limit)
                .toList();
    }

    private TopArchitect score(Architect architect) {
        List<Integer> stars = feedbackRepo.findByArchitectArchitectId(architect.getArchitectId()).stream()
                .map(Feedback::getRating)
                .filter(Objects::nonNull)
                .toList();

        double adminRating = architect.getRating() == null ? 0 : architect.getRating();
        int userTotal = stars.stream().mapToInt(Integer::intValue).sum();

        double score = (adminRating * 2 + userTotal) / (2 + stars.size());
        Double userAverage = stars.isEmpty() ? null : (double) userTotal / stars.size();

        return new TopArchitect(architect, score, userAverage, stars.size());
    }
}
