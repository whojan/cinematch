import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tmdbService } from './tmdb';
import { userContentCache, generateCacheKey } from '../../../shared/utils/cache';

// Mock fetch
const mockFetch = vi.fn();
const globalObj = globalThis as any;
globalObj.fetch = mockFetch;

// Mock environment variables
vi.mock('import.meta.env', () => ({
  env: {
    VITE_TMDB_API_KEY: 'test_api_key',
    VITE_TMDB_BASE_URL: 'https://api.themoviedb.org/3',
    VITE_TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p'
  }
}));

describe('TMDbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tmdbService.clearCache();
    userContentCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    userContentCache.clear();
  });

  describe('getPersonMovieCredits', () => {
    it('should fetch movie credits successfully', async () => {
      const mockResponse = {
        id: 31,
        cast: [
          { id: 1, title: 'Test Movie', character: 'Test Character' }
        ],
        crew: [
          { id: 2, title: 'Test Movie 2', job: 'Director' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await tmdbService.getPersonMovieCredits(31);

      expect(result).toBeDefined();
      expect(result.cast).toHaveLength(1);
      expect(result.cast[0].media_type).toBe('movie');
      expect(result.crew[0].media_type).toBe('movie');
    });

    it('should throw error for invalid person ID', async () => {
      await expect(tmdbService.getPersonMovieCredits(0)).rejects.toThrow('Invalid person ID provided');
      await expect(tmdbService.getPersonMovieCredits(-1)).rejects.toThrow('Invalid person ID provided');
    });

    it('should handle 404 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          status_code: 34,
          status_message: 'The resource you requested could not be found.'
        })
      });

      await expect(tmdbService.getPersonMovieCredits(999999)).rejects.toThrow();
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(tmdbService.getPersonMovieCredits(31)).rejects.toThrow('Network error occurred');
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 15000))
      );

      await expect(tmdbService.getPersonMovieCredits(31)).rejects.toThrow('Request timeout');
    });
  });

  describe('getPersonCombinedCredits', () => {
    it('should combine movie and TV credits', async () => {
      const mockMovieResponse = {
        id: 31,
        cast: [{ id: 1, title: 'Movie 1', character: 'Character 1' }],
        crew: []
      };

      const mockTVResponse = {
        id: 31,
        cast: [{ id: 2, name: 'TV Show 1', character: 'Character 2' }],
        crew: []
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMovieResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTVResponse
        });

      const result = await tmdbService.getPersonCombinedCredits(31);

      expect(result.cast).toHaveLength(2);
      expect(result.cast[0].media_type).toBe('movie');
      expect(result.cast[1].media_type).toBe('tv');
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = {
        id: 31,
        cast: [{ id: 1, title: 'Movie 1' }],
        crew: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      await tmdbService.getPersonCombinedCredits(31);
      
      // Second call should use cache
      await tmdbService.getPersonCombinedCredits(31);

      // Should only make 2 API calls (movie + TV) for the first request
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMovieDetails', () => {
    it('should fetch movie details successfully', async () => {
      const mockResponse = {
        id: 550,
        title: 'Fight Club',
        overview: 'Test overview',
        vote_average: 8.8,
        videos: { results: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await tmdbService.getMovieDetails(550);

      expect(result).toBeDefined();
      expect(result.title).toBe('Fight Club');
      expect(result.vote_average).toBe(8.8);
    });

    it('should fetch English videos if Turkish not available', async () => {
      const mockTurkishResponse = {
        id: 550,
        title: 'Fight Club',
        videos: { results: [] }
      };

      const mockEnglishResponse = {
        id: 550,
        title: 'Fight Club',
        videos: { 
          results: [{ key: 'test-key', name: 'Trailer' }] 
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTurkishResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEnglishResponse
        });

      const result = await tmdbService.getMovieDetails(550);

      expect(result.videos?.results).toHaveLength(1);
      expect(result.videos?.results[0].key).toBe('test-key');
    });
  });

  describe('Cache functionality', () => {
    it('should return cache statistics', () => {
      const stats = tmdbService.getCacheStats();
      
      expect(stats).toHaveProperty('personFilmography');
      expect(stats).toHaveProperty('movieDetails');
      expect(stats).toHaveProperty('search');
    });

    it('should clear all caches', () => {
      tmdbService.clearCache();
      
      const stats = tmdbService.getCacheStats();
      expect(stats.personFilmography.size).toBe(0);
      expect(stats.movieDetails.size).toBe(0);
      expect(stats.search.size).toBe(0);
    });
  });
});

describe('TMDbService Cache Functions', () => {
  let tmdbServiceInstance: typeof tmdbService;

  beforeEach(() => {
    tmdbServiceInstance = tmdbService;
    userContentCache.clear();
  });

  afterEach(() => {
    userContentCache.clear();
  });

  describe('cacheUserContent', () => {
    it('should cache movie content', async () => {
      const movieId = 123;
      const mediaType = 'movie';
      const cacheKey = generateCacheKey.userContent(movieId, mediaType);

      // Mock getMovieDetails to return test data
      const mockMovieData = { id: movieId, title: 'Test Movie', vote_average: 8.5 };
      vi.spyOn(tmdbServiceInstance, 'getMovieDetails').mockResolvedValue(mockMovieData as any);

      await tmdbServiceInstance.cacheUserContent(movieId, mediaType);

      const cachedData = userContentCache.get(cacheKey);
      expect(cachedData).toEqual(mockMovieData);
    });

    it('should cache TV show content', async () => {
      const tvId = 456;
      const mediaType = 'tv';
      const cacheKey = generateCacheKey.userContent(tvId, mediaType);

      // Mock getTVShowDetails to return test data
      const mockTVData = { id: tvId, name: 'Test TV Show', vote_average: 7.8 };
      vi.spyOn(tmdbServiceInstance, 'getTVShowDetails').mockResolvedValue(mockTVData as any);

      await tmdbServiceInstance.cacheUserContent(tvId, mediaType);

      const cachedData = userContentCache.get(cacheKey);
      expect(cachedData).toEqual(mockTVData);
    });

    it('should not cache if already cached', async () => {
      const movieId = 123;
      const mediaType = 'movie';
      const cacheKey = generateCacheKey.userContent(movieId, mediaType);

      // Pre-cache the data
      const existingData = { id: movieId, title: 'Existing Movie' };
      userContentCache.set(cacheKey, existingData);

      // Mock getMovieDetails but it shouldn't be called
      const mockGetMovieDetails = vi.spyOn(tmdbServiceInstance, 'getMovieDetails').mockResolvedValue({} as any);

      await tmdbServiceInstance.cacheUserContent(movieId, mediaType);

      // Verify getMovieDetails was not called
      expect(mockGetMovieDetails).not.toHaveBeenCalled();

      // Verify cached data remains unchanged
      const cachedData = userContentCache.get(cacheKey);
      expect(cachedData).toEqual(existingData);
    });
  });

  describe('cacheMultipleUserContent', () => {
    it('should cache multiple contents', async () => {
      const contents = [
        { id: 123, mediaType: 'movie' as const },
        { id: 456, mediaType: 'tv' as const }
      ];

      // Mock both methods
      const mockMovieData = { id: 123, title: 'Test Movie' };
      const mockTVData = { id: 456, name: 'Test TV Show' };
      
      vi.spyOn(tmdbServiceInstance, 'getMovieDetails').mockResolvedValue(mockMovieData as any);
      vi.spyOn(tmdbServiceInstance, 'getTVShowDetails').mockResolvedValue(mockTVData as any);

      await tmdbServiceInstance.cacheMultipleUserContent(contents);

      // Verify both contents are cached
      const movieCacheKey = generateCacheKey.userContent(123, 'movie');
      const tvCacheKey = generateCacheKey.userContent(456, 'tv');

      expect(userContentCache.get(movieCacheKey)).toEqual(mockMovieData);
      expect(userContentCache.get(tvCacheKey)).toEqual(mockTVData);
    });
  });

  describe('getUserContentFromCache', () => {
    it('should retrieve cached content', () => {
      const movieId = 123;
      const mediaType = 'movie';
      const cacheKey = generateCacheKey.userContent(movieId, mediaType);
      const testData = { id: movieId, title: 'Test Movie' };

      userContentCache.set(cacheKey, testData);

      const result = tmdbServiceInstance.getUserContentFromCache(movieId, mediaType);
      expect(result).toEqual(testData);
    });

    it('should return null for non-cached content', () => {
      const result = tmdbServiceInstance.getUserContentFromCache(999, 'movie');
      expect(result).toBeNull();
    });
  });

  describe('generateCacheKey', () => {
    it('should generate correct cache keys', () => {
      expect(generateCacheKey.userContent(123, 'movie')).toBe('user_content_movie_123');
      expect(generateCacheKey.userContent(456, 'tv')).toBe('user_content_tv_456');
    });
  });
});