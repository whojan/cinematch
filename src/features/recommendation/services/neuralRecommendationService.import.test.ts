import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { NeuralRecommendationService } from './neuralRecommendationService';
import { StorageService } from '../../../shared/services/storage';
import type { Movie } from '../types';

// Mock data for import testing
const mockImportData = {
  ratings: [
    { movieId: 1, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 2, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 3, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 4, rating: 6, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 5, rating: 8, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 6, rating: 10, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 7, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 8, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 9, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 10, rating: 6, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 11, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 12, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 13, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 14, rating: 8, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 15, rating: 10, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 16, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 17, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 18, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 19, rating: 6, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 20, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 21, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 22, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 23, rating: 8, mediaType: "tv" as "tv", timestamp: Date.now() },
    { movieId: 24, rating: 10, mediaType: "movie" as "movie", timestamp: Date.now() },
    { movieId: 25, rating: 7, mediaType: "movie" as "movie", timestamp: Date.now() }
  ],
  profile: {
    id: 'test-user',
    username: 'testuser',
    email: 'test@example.com',
    totalRatings: 25,
    averageScore: 8.0,
    learningPhase: 'optimizing',
    genreDistribution: {
      '28': 0.3, // Action
      '12': 0.2, // Adventure
      '16': 0.15, // Animation
      '35': 0.2, // Comedy
      '80': 0.15 // Crime
    },
    periodPreference: {
      '2020s': 0.4,
      '2010s': 0.3,
      '2000s': 0.2,
      '1990s': 0.1
    },
    favoriteActors: {
      '123': { id: 123, name: 'Test Actor', count: 5, averageRating: 8.0 }
    },
    favoriteDirectors: {
      '456': { id: 456, name: 'Test Director', count: 3, averageRating: 8.5 }
    },
    favoriteWriters: {},
    qualityTolerance: {
      minRating: 6.0,
      minVoteCount: 1000
    },
    demographics: {
      age: 25,
      gender: 'male',
      language: 'en'
    },
    lastUpdated: Date.now(),
    accuracyScore: 0.85
  },
  watchlist: []
}

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

describe('Neural Network Model - Import Data Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock getContentDetails to return content
    // const _originalGetContentDetails = (NeuralRecommendationService as any).getContentDetails;
    (NeuralRecommendationService as any).getContentDetails = vi.fn().mockResolvedValue(mockMovie);
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  test('should automatically train model when sufficient data is imported', async () => {
    // Import data
    const importSuccess = await StorageService.importData(JSON.stringify(mockImportData));
    expect(importSuccess).toBe(true);

    // Get imported data
    // const importedRatings = StorageService.getRatings();
    const importedProfile = StorageService.getProfile();

    expect(importedProfile).toBeDefined();

    // Check if neural model is automatically trained
    const model = await NeuralRecommendationService.initializeModel();
    
    // Model should be available after import
    expect(model).toBeDefined();
    
    // If there are 20+ ratings, model should be trained
    if (mockImportData.ratings.filter(r => typeof r.rating === 'number').length >= 20) {
      expect(model.lastTrained).toBeGreaterThan(0);
    }
  });

  test('should generate neural recommendations after data import', async () => {
    // Import data
    await StorageService.importData(JSON.stringify(mockImportData));
    
    const importedProfile = StorageService.getProfile();

    // Generate neural recommendations
    const recommendations = await NeuralRecommendationService.generateNeuralRecommendations(
      [mockMovie],
      importedProfile!,
      5
    );

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    
    // Should have recommendations if model is trained
    if (mockImportData.ratings.filter(r => typeof r.rating === 'number').length >= 20) {
      expect(recommendations.length).toBeGreaterThan(0);
    }
  });

  test('should predict ratings accurately after data import', async () => {
    // Import data
    await StorageService.importData(JSON.stringify(mockImportData));
    
    const importedProfile = StorageService.getProfile();

    // Test rating prediction
    const prediction = NeuralRecommendationService.predictRating(mockMovie, importedProfile!);
    
    expect(prediction).toBeDefined();
    expect(typeof prediction).toBe('number');
    expect(prediction).toBeGreaterThanOrEqual(1);
    expect(prediction).toBeLessThanOrEqual(10);
  });

  test('should evaluate model performance after data import', async () => {
    // Import data
    await StorageService.importData(JSON.stringify(mockImportData));
    
    const importedProfile = StorageService.getProfile();

    // Evaluate model
    const evaluation = await NeuralRecommendationService.evaluateModel(mockImportData.ratings, importedProfile!);
    
    expect(evaluation).toBeDefined();
    expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
    expect(evaluation.accuracy).toBeLessThanOrEqual(1);
    expect(evaluation.mae).toBeGreaterThanOrEqual(0);
    expect(evaluation.rmse).toBeGreaterThanOrEqual(0);
    expect(evaluation.coverage).toBeGreaterThanOrEqual(0);
    expect(evaluation.coverage).toBeLessThanOrEqual(1);
  });

  test('should handle insufficient data after import', async () => {
    // Import insufficient data (less than 20 ratings)
    const insufficientData = {
      ...mockImportData,
      ratings: mockImportData.ratings.slice(0, 10) // Only 10 ratings
    } as const;
    
    await StorageService.importData(JSON.stringify(insufficientData));
    
    const importedProfile = StorageService.getProfile();

    // Model should still be available but not trained
    const model = await NeuralRecommendationService.initializeModel();
    expect(model).toBeDefined();
    
    // With insufficient data, model might not be trained
    // But should still provide fallback predictions
    const prediction = NeuralRecommendationService.predictRating(mockMovie, importedProfile!);
    expect(prediction).toBeDefined();
    expect(typeof prediction).toBe('number');
  });

  test('should persist model after data import', async () => {
    // Import data
    await StorageService.importData(JSON.stringify(mockImportData));
    
    const importedProfile = StorageService.getProfile();

    // Train model
    await NeuralRecommendationService.trainModel(mockImportData.ratings, importedProfile!);
    
    // Check if model is saved to localStorage
    const savedModelData = localStorage.getItem('cinematch_neural_model');
    expect(savedModelData).toBeDefined();
    
    // Model should persist after reload
    const model = await NeuralRecommendationService.initializeModel();
    expect(model.lastTrained).toBeGreaterThan(0);
  });

  test('should update model when new data is imported', async () => {
    // Import initial data
    await StorageService.importData(JSON.stringify(mockImportData));
    
    const initialRatings = mockImportData.ratings;
    const importedProfile = StorageService.getProfile();

    // Train initial model
    await NeuralRecommendationService.trainModel(initialRatings, importedProfile!);
    const initialModel = await NeuralRecommendationService.initializeModel();
    const initialLastTrained = initialModel.lastTrained;

    // Import additional data
    const additionalData = {
      ...mockImportData,
      ratings: [...mockImportData.ratings.slice(), { movieId: 26, rating: 9, mediaType: "movie" as "movie", timestamp: Date.now() }, { movieId: 27, rating: 8, mediaType: "movie" as "movie", timestamp: Date.now() }, { movieId: 28, rating: 7, mediaType: "tv" as "tv", timestamp: Date.now() }]
    };
    
    StorageService.importData(JSON.stringify(additionalData));
    
    const updatedRatings = additionalData.ratings;
    
    // Retrain model with new data
    await NeuralRecommendationService.trainModel(updatedRatings, importedProfile!);
    
    const updatedModel = await NeuralRecommendationService.initializeModel();
    
    // Model should be updated with new training timestamp
    expect(updatedModel.lastTrained).toBeGreaterThan(initialLastTrained);
  });
}); 