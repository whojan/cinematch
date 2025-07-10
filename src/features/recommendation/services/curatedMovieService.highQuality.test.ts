import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CuratedMovieService } from './curatedMovieService';
import { tmdbService } from '../../content/services/tmdb';

// Mock tmdbService
vi.mock('../../content/services/tmdb', () => ({
  tmdbService: {
    discoverMovies: vi.fn(),
    discoverTVShows: vi.fn()
  }
}));

describe('CuratedMovieService - High Quality Content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCuratedInitialContent - No Ratings', () => {
    it('should fetch high-quality content when no ratings exist', async () => {
      // Mock high-quality responses
      const mockPopularMovies = {
        results: [
          { id: 1, title: 'Popular Movie 1', vote_average: 8.5, vote_count: 1500, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' },
          { id: 2, title: 'Popular Movie 2', vote_average: 8.2, vote_count: 1200, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' },
          { id: 3, title: 'Popular Movie 3', vote_average: 8.0, vote_count: 1100, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 3
      };

      const mockTopRatedMovies = {
        results: [
          { id: 4, title: 'Top Rated Movie 1', vote_average: 9.0, vote_count: 800, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' },
          { id: 5, title: 'Top Rated Movie 2', vote_average: 8.8, vote_count: 750, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 2
      };

      const mockPopularTV = {
        results: [
          { id: 6, name: 'Popular TV 1', vote_average: 8.3, vote_count: 600, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'tv' as 'tv', first_air_date: '2020-01-01' },
          { id: 7, name: 'Popular TV 2', vote_average: 8.1, vote_count: 550, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'tv' as 'tv', first_air_date: '2020-01-01' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 2
      };

      const mockTopRatedTV = {
        results: [
          { id: 8, name: 'Top Rated TV 1', vote_average: 9.2, vote_count: 400, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'tv' as 'tv', first_air_date: '2020-01-01' },
          { id: 9, name: 'Top Rated TV 2', vote_average: 9.0, vote_count: 350, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'tv' as 'tv', first_air_date: '2020-01-01' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 2
      };

      vi.mocked(tmdbService.discoverMovies)
        .mockResolvedValueOnce(mockPopularMovies)
        .mockResolvedValueOnce(mockTopRatedMovies);

      vi.mocked(tmdbService.discoverTVShows)
        .mockResolvedValueOnce(mockPopularTV)
        .mockResolvedValueOnce(mockTopRatedTV);

      const progressCallback = vi.fn();

      const result = await CuratedMovieService.getCuratedInitialContent([], progressCallback);

      // Should call high-quality content endpoints
      expect(tmdbService.discoverMovies).toHaveBeenCalledWith({
        'vote_average.gte': 7.5,
        'vote_count.gte': 100,
        sort_by: 'popularity.desc',
        page: 1
      });

      expect(tmdbService.discoverMovies).toHaveBeenCalledWith({
        'vote_average.gte': 8.0,
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc',
        page: 1
      });

      expect(tmdbService.discoverTVShows).toHaveBeenCalledWith({
        'vote_average.gte': 7.5,
        'vote_count.gte': 100,
        sort_by: 'popularity.desc',
        page: 1
      });

      expect(tmdbService.discoverTVShows).toHaveBeenCalledWith({
        'vote_average.gte': 8.0,
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc',
        page: 1
      });

      // Should return content with media_type
      result.forEach(item => {
        expect(item.media_type).toBeDefined();
        expect(['movie', 'tv']).toContain(item.media_type);
      });

      // Should call progress callback with high-quality messages
      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 4,
        message: 'En popüler ve yüksek puanlı içerikler aranıyor...'
      });
    });

    it('should fallback to normal flow if high-quality content fails', async () => {
      // Mock failed high-quality requests
      vi.mocked(tmdbService.discoverMovies).mockRejectedValue(new Error('API Error'));
      vi.mocked(tmdbService.discoverTVShows).mockRejectedValue(new Error('API Error'));

      const progressCallback = vi.fn();

      await CuratedMovieService.getCuratedInitialContent([], progressCallback);

      // Should call progress callback for normal flow
      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 15,
        message: 'Tür bazlı içerikler aranıyor...'
      });
    });
  });

  describe('getCuratedInitialContent - With Ratings', () => {
    it('should use normal flow when ratings exist', async () => {
      const existingRatings = [
        { movieId: 1, rating: 8, timestamp: Date.now(), mediaType: "movie" as "movie" }
      ];

      const progressCallback = vi.fn();

      await CuratedMovieService.getCuratedInitialContent(existingRatings, progressCallback);

      // Should call progress callback for normal flow, not high-quality
      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 15,
        message: 'Tür bazlı içerikler aranıyor...'
      });

      // Should not call high-quality endpoints
      expect(tmdbService.discoverMovies).not.toHaveBeenCalledWith({
        'vote_average.gte': 7.5,
        'vote_count.gte': 100,
        sort_by: 'popularity.desc',
        page: 1
      });
    });
  });

  describe('getRandomMovieFromGroup - Higher Quality', () => {
    it('should use higher quality criteria', async () => {
      const mockResponse = {
        results: [
          { id: 1, title: 'Test Movie', vote_average: 8.0, vote_count: 600, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'movie' as 'movie' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 1
      };

      vi.mocked(tmdbService.discoverMovies).mockResolvedValue(mockResponse);

      await CuratedMovieService['getRandomMovieFromGroup'](
        [28], // Action genre
        new Set(),
        new Set()
      );

      // Should use higher quality criteria
      expect(tmdbService.discoverMovies).toHaveBeenCalledWith({
        with_genres: '28',
        'vote_average.gte': 7.0,
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc',
        page: expect.any(Number)
      });
    });
  });

  describe('getRandomTVShowFromGroup - Higher Quality', () => {
    it('should use higher quality criteria', async () => {
      const mockResponse = {
        results: [
          { id: 1, name: 'Test TV Show', vote_average: 8.0, vote_count: 400, release_date: '2020-01-01', overview: '', poster_path: '', backdrop_path: '', genre_ids: [] as number[], original_language: 'en', media_type: 'tv' as 'tv', first_air_date: '2020-01-01' }
        ],
        page: 1,
        total_pages: 1,
        total_results: 1
      };

      vi.mocked(tmdbService.discoverTVShows).mockResolvedValue(mockResponse);

      await CuratedMovieService['getRandomTVShowFromGroup'](
        [18], // Drama genre
        new Set(),
        new Set()
      );

      // Should use higher quality criteria
      expect(tmdbService.discoverTVShows).toHaveBeenCalledWith({
        with_genres: '18',
        'vote_average.gte': 7.0,
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc',
        page: expect.any(Number)
      });
    });
  });
}); 