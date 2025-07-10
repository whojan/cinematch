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

describe('CuratedMovieService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInitialRatingContent', () => {
    it('should return 10 initial content items for AI learning from TMDB top 100', async () => {
      // Mock successful responses for TMDB top 100
      const mockPopularMovies = {
        results: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          title: `Popular Movie ${i + 1}`,
          vote_average: 8.5 - (i * 0.1),
          vote_count: 1500 - (i * 10),
          media_type: "movie" as "movie",
          release_date: '2020-01-01',
          overview: '',
          poster_path: '',
          backdrop_path: '',
          genre_ids: [] as number[],
          original_language: 'en'
        }) as const),
        page: 1,
        total_pages: 1,
        total_results: 50
      };

      const mockPopularTV = {
        results: Array.from({ length: 50 }, (_, i) => ({
          id: i + 51,
          name: `Popular TV ${i + 1}`,
          vote_average: 8.3 - (i * 0.1),
          vote_count: 600 - (i * 5),
          media_type: "tv" as "tv",
          release_date: '2020-01-01',
          overview: '',
          poster_path: '',
          backdrop_path: '',
          genre_ids: [] as number[],
          original_language: 'en',
          first_air_date: '2020-01-01'
        }) as const),
        page: 1,
        total_pages: 1,
        total_results: 50
      };

      vi.mocked(tmdbService.discoverMovies)
        .mockResolvedValueOnce(mockPopularMovies);

      vi.mocked(tmdbService.discoverTVShows)
        .mockResolvedValueOnce(mockPopularTV);

      const progressCallback = vi.fn();

      const result = await CuratedMovieService.getInitialRatingContent(progressCallback);

      // Should return exactly 10 items for AI learning
      expect(result).toHaveLength(10);

      // Should have called progress callback with correct messages
      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 4,
        message: 'TMDB ilk 100 içeriği aranıyor...'
      });

      // Should have called TMDB service methods
      expect(tmdbService.discoverMovies).toHaveBeenCalledTimes(1);
      expect(tmdbService.discoverTVShows).toHaveBeenCalledTimes(1);

      // Check that all items have media_type
      result.forEach(item => {
        expect(item.media_type).toBeDefined();
        expect(['movie', 'tv']).toContain(item.media_type);
      });
    });

    it('should handle errors gracefully and return fallback content', async () => {
      // Mock failed responses
      vi.mocked(tmdbService.discoverMovies).mockRejectedValue(new Error('API Error'));
      vi.mocked(tmdbService.discoverTVShows).mockRejectedValue(new Error('API Error'));

      const result = await CuratedMovieService.getInitialRatingContent();

      // Should return empty array when all requests fail
      expect(result).toEqual([]);
    });

    it('should return fallback content when main requests fail but fallback succeeds', async () => {
      // Mock failed main requests
      vi.mocked(tmdbService.discoverMovies)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          results: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            title: `Fallback Movie ${i + 1}`,
            vote_average: 7.5 - (i * 0.1),
            vote_count: 500 - (i * 10),
            media_type: "movie" as "movie",
            release_date: '2020-01-01',
            overview: '',
            poster_path: '',
            backdrop_path: '',
            genre_ids: [] as number[],
            original_language: 'en'
          }) as const),
          page: 1,
          total_pages: 1,
          total_results: 10
        });

      vi.mocked(tmdbService.discoverTVShows).mockRejectedValue(new Error('API Error'));

      const result = await CuratedMovieService.getInitialRatingContent();

      // Should return fallback content
      expect(result).toHaveLength(10);
      result.forEach(item => {
        expect(item.media_type).toBe('movie');
      });
    });
  });
}); 