import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMovieData } from './useMovieData';
import { CuratedMovieService } from '../services/curatedMovieService';
import { RecommendationService } from '../services/recommendationService';
import { ProfileService } from '../../profile/services/profileService';

// Mock services
vi.mock('../services/curatedMovieService');
vi.mock('../services/recommendationService');
vi.mock('../../profile/services/profileService');
vi.mock('../../content/services/tmdb', () => ({
  tmdbService: {
    fetchGenres: vi.fn().mockResolvedValue([]),
    fetchTVGenres: vi.fn().mockResolvedValue([]),
    discoverMovies: vi.fn().mockResolvedValue({ results: [] }),
    discoverTVShows: vi.fn().mockResolvedValue({ results: [] })
  }
}));

describe('useMovieData - AI Recommendations Threshold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock CuratedMovieService
    vi.mocked(CuratedMovieService.getInitialRatingContent).mockResolvedValue([
      { id: 1, title: 'Test Movie 1', media_type: 'movie', release_date: '2023-01-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 7.5, vote_count: 1000, genre_ids: [28] },
      { id: 2, title: 'Test Movie 2', media_type: 'movie', release_date: '2023-02-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 8.0, vote_count: 1500, genre_ids: [35] },
      { id: 3, title: 'Test Movie 3', media_type: 'movie', release_date: '2023-03-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 6.5, vote_count: 800, genre_ids: [14] },
      { id: 4, title: 'Test Movie 4', media_type: 'movie', release_date: '2023-04-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 7.8, vote_count: 1200, genre_ids: [28] },
      { id: 5, title: 'Test Movie 5', media_type: 'movie', release_date: '2023-05-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 8.5, vote_count: 2000, genre_ids: [18] },
      { id: 6, title: 'Test Movie 6', media_type: 'movie', release_date: '2023-06-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 7.2, vote_count: 900, genre_ids: [35] },
      { id: 7, title: 'Test Movie 7', media_type: 'movie', release_date: '2023-07-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 6.8, vote_count: 700, genre_ids: [27] },
      { id: 8, title: 'Test Movie 8', media_type: 'movie', release_date: '2023-08-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 8.2, vote_count: 1800, genre_ids: [14] },
      { id: 9, title: 'Test Movie 9', media_type: 'movie', release_date: '2023-09-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 7.0, vote_count: 600, genre_ids: [16] },
      { id: 10, title: 'Test Movie 10', media_type: 'movie', release_date: '2023-10-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 8.8, vote_count: 2500, genre_ids: [18] }
    ]);
    
    vi.mocked(CuratedMovieService.getCuratedInitialContent).mockResolvedValue([]);
    
    // Mock RecommendationService
    vi.mocked(RecommendationService.generateRecommendations).mockResolvedValue([]);
    
        // Mock ProfileService
    vi.mocked(ProfileService.generateProfile).mockResolvedValue({
      learningPhase: 'initial',
      totalRatings: 0,
      averageScore: 0,
      genreDistribution: {},
      genreQualityDistribution: {},
      periodPreference: {},
      tempoPreference: { seasonality: 0.5, recency: 0.5 },
      favoriteActors: {},
      favoriteDirectors: {},
      qualityTolerance: { minRating: 6, minVoteCount: 100, preferredDecades: [] },
      demographics: { age: 25, gender: 'prefer_not_to_say', language: 'en' },
      lastUpdated: Date.now()
    });
  });

  it('should not generate AI recommendations when user has less than 10 ratings', async () => {
    const { result: _result } = renderHook(() => useMovieData());

    // Simulate initial load with no ratings
    await act(async () => {
      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify that RecommendationService was not called
    expect(RecommendationService.generateRecommendations).not.toHaveBeenCalled();
  });

  it('should generate AI recommendations when user reaches 10 ratings', async () => {
    const { result: _result } = renderHook(() => useMovieData());

    // Simulate initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Add 10 ratings
    for (let i = 1; i <= 10; i++) {
      await act(async () => {
        await _result.current.rateMovie(i, 8, 'movie');
      });
    }

    // Verify that RecommendationService was called after 10th rating
    expect(RecommendationService.generateRecommendations).toHaveBeenCalledTimes(1);
  });

  it('should show AI learning content when no data exists', async () => {
    renderHook(() => useMovieData());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify that getInitialRatingContent was called for AI learning
    expect(CuratedMovieService.getInitialRatingContent).toHaveBeenCalled();
  });

  it('should clear recommendations when user has less than 10 ratings', async () => {
    const { result } = renderHook(() => useMovieData());

    // Simulate having some recommendations initially
    await act(async () => {
      // Mock some existing recommendations  
      result.current.recommendations = [
        { movie: { id: 1, title: 'Test', media_type: 'movie', release_date: '2023-01-01', overview: 'Test overview', poster_path: null, backdrop_path: null, vote_average: 7.5, vote_count: 1000, genre_ids: [28] }, matchScore: 0.8, reasons: [], confidence: 0.8, novelty: 0.5, diversity: 0.5, explanation: { primaryFactors: [], secondaryFactors: [], riskFactors: [] }, recommendationType: 'safe' }
      ];
    });

    // Simulate initial load with no ratings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify that recommendations are cleared
    expect(result.current.recommendations).toEqual([]);
  });
}); 