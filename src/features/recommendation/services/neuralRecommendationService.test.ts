import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NeuralRecommendationService } from './neuralRecommendationService';
import type { UserProfile, UserRating, Movie, TVShow } from '../types';

// Mock data for testing
const mockProfile: UserProfile = {
  totalRatings: 50,
  averageScore: 7.5,
  learningPhase: 'optimizing',
  genreDistribution: {
    '28': 0.3, // Action
    '12': 0.2, // Adventure
    '16': 0.15, // Animation
    '35': 0.2, // Comedy
    '80': 0.15 // Crime
  },
  genreQualityDistribution: {},
  periodPreference: {
    '2020s': 0.4,
    '2010s': 0.3,
    '2000s': 0.2,
    '1990s': 0.1
  },
  tempoPreference: { seasonality: 0.5, recency: 0.5 },
  favoriteActors: {
    '123': { name: 'Test Actor', count: 5, averageRating: 8.0 }
  },
  favoriteDirectors: {
    '456': { name: 'Test Director', count: 3, averageRating: 8.5 }
  },
  qualityTolerance: {
    minRating: 6.0,
    minVoteCount: 1000,
    preferredDecades: ['2020s', '2010s']
  },
  demographics: {
    age: 25,
    gender: 'male',
    language: 'en'
  },
  lastUpdated: Date.now(),
  accuracyScore: 0.85
};

const mockRatings: UserRating[] = [
  { movieId: 1, rating: 8, mediaType: 'movie', timestamp: Date.now() },
  { movieId: 2, rating: 7, mediaType: 'movie', timestamp: Date.now() },
  { movieId: 3, rating: 9, mediaType: 'movie', timestamp: Date.now() },
  { movieId: 4, rating: 6, mediaType: 'tv', timestamp: Date.now() },
  { movieId: 5, rating: 8, mediaType: 'tv', timestamp: Date.now() }
];

const mockMovie: Movie = {
  id: 1,
  title: 'Test Movie',
  overview: 'A test movie for neural network testing',
  poster_path: '/test.jpg',
  backdrop_path: '/test-backdrop.jpg',
  release_date: '2023-01-01',
  vote_average: 7.5,
  vote_count: 1000,
  genre_ids: [28, 12], // Action, Adventure
  adult: false,
    original_language: 'en'
};

const mockTVShow: TVShow = {
  id: 101,
  name: 'Test TV Show',
  overview: 'A test TV show for neural network testing',
  poster_path: '/test-tv.jpg',
  backdrop_path: '/test-tv-backdrop.jpg',
  first_air_date: '2023-01-01',
  vote_average: 8.0,
  vote_count: 500,
  genre_ids: [16, 35], // Animation, Comedy
  adult: false,
    original_language: 'en'
};

describe('NeuralRecommendationService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Model Initialization', () => {
    test('should initialize model successfully', async () => {
      const model = await NeuralRecommendationService.initializeModel();
      
      expect(model).toBeDefined();
      expect(model.config).toBeDefined();
      expect(model.config.inputSize).toBe(128);
      expect(model.config.hiddenLayers).toEqual([64, 32, 16]);
      expect(model.config.outputSize).toBe(1);
    });

    test('should load existing model from localStorage', async () => {
      // First initialization
      const model1 = await NeuralRecommendationService.initializeModel();
      model1.accuracy = 0.85;
      model1.lastTrained = Date.now();
      
      // Save model
      localStorage.setItem('cinematch_neural_model', JSON.stringify(model1));
      
      // Second initialization should load existing model
      const model2 = await NeuralRecommendationService.initializeModel();
      
      expect(model2.accuracy).toBe(0.85);
    });
  });

  describe('Feature Extraction', () => {
    test('should extract features for movie', () => {
      const features = NeuralRecommendationService.extractNeuralFeatures(mockMovie, mockProfile);
      
      expect(features).toBeDefined();
      expect(features.length).toBe(128);
      expect(features.every(f => typeof f === 'number')).toBe(true);
      expect(features.every(f => f >= 0 && f <= 1)).toBe(true);
    });

    test('should extract features for TV show', () => {
      const features = NeuralRecommendationService.extractNeuralFeatures(mockTVShow, mockProfile);
      
      expect(features).toBeDefined();
      expect(features.length).toBe(128);
      expect(features.every(f => typeof f === 'number')).toBe(true);
      expect(features.every(f => f >= 0 && f <= 1)).toBe(true);
    });
  });

  describe('Model Training', () => {
    test('should train model with sufficient data', async () => {
      // Mock getContentDetails to return content
      const originalGetContentDetails = (NeuralRecommendationService as any).getContentDetails;
      (NeuralRecommendationService as any).getContentDetails = vi.fn().mockResolvedValue(mockMovie);
      
      try {
        await NeuralRecommendationService.trainModel(mockRatings, mockProfile);
        
        // Model should be trained
        const model = await NeuralRecommendationService.initializeModel();
        expect(model.lastTrained).toBeGreaterThan(0);
      } finally {
        // Restore original method
        (NeuralRecommendationService as any).getContentDetails = originalGetContentDetails;
      }
    });

    test('should handle insufficient training data', async () => {
      const insufficientRatings = mockRatings.slice(0, 2); // Only 2 ratings
      
      await NeuralRecommendationService.trainModel(insufficientRatings, mockProfile);
      
      // Should not throw error, but model might not be trained
      const model = await NeuralRecommendationService.initializeModel();
      expect(model).toBeDefined();
    });
  });

  describe('Rating Prediction', () => {
    test('should predict rating for movie', () => {
      const prediction = NeuralRecommendationService.predictRating(mockMovie, mockProfile);
      
      expect(prediction).toBeDefined();
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(1);
      expect(prediction).toBeLessThanOrEqual(10);
    });

    test('should predict rating for TV show', () => {
      const prediction = NeuralRecommendationService.predictRating(mockTVShow, mockProfile);
      
      expect(prediction).toBeDefined();
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(1);
      expect(prediction).toBeLessThanOrEqual(10);
    });

    test('should use fallback prediction when model not available', () => {
      // Clear model
      localStorage.removeItem('cinematch_neural_model');
      (NeuralRecommendationService as any).model = null;
      
      const prediction = NeuralRecommendationService.predictRating(mockMovie, mockProfile);
      
      expect(prediction).toBeDefined();
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(1);
      expect(prediction).toBeLessThanOrEqual(10);
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate neural recommendations', async () => {
      const candidateContent = [mockMovie, mockTVShow];
      
      const recommendations = await NeuralRecommendationService.generateNeuralRecommendations(
        candidateContent,
        mockProfile,
        5
      );
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      if (recommendations.length > 0) {
        const recommendation = recommendations[0];
        expect(recommendation.movie).toBeDefined();
        expect(recommendation.matchScore).toBeDefined();
        expect(recommendation.reasons).toBeDefined();
        expect(recommendation.confidence).toBeDefined();
      }
    });

    test('should apply language filters', async () => {
      const candidateContent = [mockMovie, mockTVShow];
      
      const recommendations = await NeuralRecommendationService.generateNeuralRecommendations(
        candidateContent,
        mockProfile,
        5,
        { languages: ['en'] }
      );
      
      expect(recommendations).toBeDefined();
      // All recommendations should have English language
      recommendations.forEach(rec => {
        expect(rec.movie.original_language).toBe('en');
      });
    });
  });

  describe('Model Evaluation', () => {
    test('should evaluate model performance', async () => {
      // Mock getContentDetails to return content
      const originalGetContentDetails = (NeuralRecommendationService as any).getContentDetails;
      (NeuralRecommendationService as any).getContentDetails = vi.fn().mockResolvedValue(mockMovie);
      
      try {
        const evaluation = await NeuralRecommendationService.evaluateModel(mockRatings, mockProfile);
        
        expect(evaluation).toBeDefined();
        expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
        expect(evaluation.accuracy).toBeLessThanOrEqual(1);
        expect(evaluation.mae).toBeGreaterThanOrEqual(0);
        expect(evaluation.rmse).toBeGreaterThanOrEqual(0);
        expect(evaluation.coverage).toBeGreaterThanOrEqual(0);
        expect(evaluation.coverage).toBeLessThanOrEqual(1);
      } finally {
        // Restore original method
        (NeuralRecommendationService as any).getContentDetails = originalGetContentDetails;
      }
    });

    test('should handle evaluation with no model', async () => {
      // Clear model
      localStorage.removeItem('cinematch_neural_model');
      (NeuralRecommendationService as any).model = null;
      
      const evaluation = await NeuralRecommendationService.evaluateModel(mockRatings, mockProfile);
      
      expect(evaluation).toEqual({
        accuracy: 0,
        mae: 0,
        rmse: 0,
        coverage: 0
      });
    });
  });
}); 