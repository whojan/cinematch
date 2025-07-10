import type { UserProfile, UserRating } from '../types';
import { ProfileService } from '../../profile/services/profileService';
import { NeuralRecommendationService } from '../../recommendation/services/neuralRecommendationService';
import { NeuralWorkerService } from './neuralWorkerService';
import { logger } from '../../../shared/utils/logger';

interface LearningEvent {
  type: 'rating_added' | 'rating_updated' | 'rating_removed';
  contentId: number;
  oldRating?: number | 'not_watched' | 'not_interested' | 'skip';
  newRating?: number | 'not_watched' | 'not_interested' | 'skip';
  mediaType: 'movie' | 'tv';
  timestamp: number;
}

interface AdaptiveLearningConfig {
  enableRealTimeUpdates: boolean;
  enableNeuralRetraining: boolean;
  enableConfidenceAdjustment: boolean;
  learningRate: number;
  minRatingForLearning: number;
  maxLearningEvents: number;
}

export class RealTimeLearningService {
  private static readonly LEARNING_EVENTS_KEY = 'cinematch_learning_events';
  private static readonly ADAPTIVE_CONFIG_KEY = 'cinematch_adaptive_config';
  
  private static learningEvents: LearningEvent[] = [];
  private static config: AdaptiveLearningConfig = {
    enableRealTimeUpdates: true,
    enableNeuralRetraining: true,
    enableConfidenceAdjustment: true,
    learningRate: 0.1,
    minRatingForLearning: 3,
    maxLearningEvents: 1000
  };

  // Initialize real-time learning
  static initialize(): void {
    this.loadLearningEvents();
    this.loadConfig();
    
    // Initialize neural worker service
    NeuralWorkerService.initialize();
    
    logger.info('Real-time learning service initialized');
  }

  // Process a new rating event
  static async processRatingEvent(
    event: Omit<LearningEvent, 'timestamp'>,
    currentProfile: UserProfile,
    allRatings: UserRating[]
  ): Promise<{
    updatedProfile: UserProfile;
    learningInsights: string[];
    confidenceChange: number;
    shouldRetrainNeural: boolean;
  }> {
    const learningEvent: LearningEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Add event to history
    this.addLearningEvent(learningEvent);

    // Calculate immediate profile updates
    const immediateUpdates = this.calculateImmediateUpdates(learningEvent, currentProfile);
    
    // Generate updated profile (async, but with fallback)
    const updatedProfile = await this.generateUpdatedProfile(
      allRatings,
      currentProfile,
      immediateUpdates
    );

    // Calculate learning insights
    const learningInsights = this.generateLearningInsights(learningEvent, currentProfile, updatedProfile);

    // Calculate confidence change
    const confidenceChange = this.calculateConfidenceChange(learningEvent, currentProfile, updatedProfile);

    // Determine if neural network should be retrained
    const shouldRetrainNeural = this.shouldRetrainNeuralNetwork(learningEvent, allRatings);

    // Apply adaptive learning adjustments
    if (this.config.enableConfidenceAdjustment) {
      this.applyAdaptiveLearningAdjustments(updatedProfile, learningEvent, confidenceChange);
    }

    logger.info(`Real-time learning processed: ${event.type} for content ${event.contentId}`);

    return {
      updatedProfile,
      learningInsights,
      confidenceChange,
      shouldRetrainNeural
    };
  }

  // Calculate immediate profile updates based on rating event
  private static calculateImmediateUpdates(
    event: LearningEvent,
    profile: UserProfile
  ): Partial<UserProfile> {
    const updates: Partial<UserProfile> = {};

    if (event.type === 'rating_added' && typeof event.newRating === 'number') {
      // Update average score immediately
      const newTotalRatings = profile.totalRatings + 1;
      const newTotalScore = profile.averageScore * profile.totalRatings + event.newRating;
      updates.averageScore = newTotalScore / newTotalRatings;
      updates.totalRatings = newTotalRatings;

      // Update learning phase if needed
      if (newTotalRatings >= 50 && profile.learningPhase === 'profiling') {
        updates.learningPhase = 'testing';
      } else if (newTotalRatings >= 100 && profile.learningPhase === 'testing') {
        updates.learningPhase = 'optimizing';
      }

      // Update last activity
      updates.lastUpdated = Date.now();
    }

    return updates;
  }

  // Generate updated profile with real-time adjustments
  private static async generateUpdatedProfile(
    allRatings: UserRating[],
    _currentProfile: UserProfile,
    immediateUpdates: Partial<UserProfile>
  ): Promise<UserProfile> {
    // Eğer 10'dan az puanlama varsa, tam profil hesaplaması yapma
    const validRatings = allRatings.filter(r => typeof r.rating === 'number');
    if (validRatings.length < 10) {
      return _currentProfile;
    }

    // Generate full profile update (this will recalculate all distributions)
    const updatedProfile = await ProfileService.generateProfile(allRatings);

    if (!updatedProfile) {
      return _currentProfile; // Fallback to current profile
    }

    // Merge immediate updates with full profile
    const finalProfile = {
      ...updatedProfile,
      ...immediateUpdates,
      // Preserve some real-time calculated values
      lastUpdated: immediateUpdates.lastUpdated || updatedProfile.lastUpdated
    } as UserProfile;

    return finalProfile;
  }

  // Generate learning insights from the event
  private static generateLearningInsights(
    event: LearningEvent,
    oldProfile: UserProfile,
    newProfile: UserProfile
  ): string[] {
    const insights: string[] = [];

    if (event.type === 'rating_added' && typeof event.newRating === 'number') {
      // Rating-based insights
      if (event.newRating >= 4) {
        insights.push('Yüksek puanlama: Bu tür içerikleri daha fazla önerebiliriz');
      } else if (event.newRating <= 2) {
        insights.push('Düşük puanlama: Bu tür içerikleri daha az önerebiliriz');
      }

      // Learning phase insights
      if (newProfile.learningPhase !== oldProfile.learningPhase) {
        insights.push(`Öğrenme aşaması güncellendi: ${oldProfile.learningPhase} → ${newProfile.learningPhase}`);
      }

      // Genre preference insights
      const genreChanges = this.analyzeGenrePreferenceChanges(oldProfile, newProfile);
      if (genreChanges.length > 0) {
        insights.push(`Tür tercihleri güncellendi: ${genreChanges.join(', ')}`);
      }
    }

    return insights;
  }

  // Analyze changes in genre preferences
  private static analyzeGenrePreferenceChanges(
    oldProfile: UserProfile,
    newProfile: UserProfile
  ): string[] {
    const changes: string[] = [];

    // Find significant changes (>5% difference)
    for (const [genreId, newPercentage] of Object.entries(newProfile.genreDistribution)) {
      const numericGenreId = parseInt(genreId, 10);
      const oldPercentage = oldProfile.genreDistribution[numericGenreId] || 0;
      const change = newPercentage - oldPercentage;
      
      if (Math.abs(change) > 5) {
        const changeText = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
        changes.push(`${genreId}: ${changeText}`);
      }
    }

    return changes;
  }

  // Calculate confidence change based on rating event
  private static calculateConfidenceChange(
    event: LearningEvent,
    oldProfile: UserProfile,
    newProfile: UserProfile
  ): number {
    let confidenceChange = 0;

    if (event.type === 'rating_added' && typeof event.newRating === 'number') {
      // Base confidence increase for new rating
      confidenceChange += 0.01;

      // Higher confidence for extreme ratings (1 or 5)
      if (event.newRating === 1 || event.newRating === 5) {
        confidenceChange += 0.02;
      }

      // Higher confidence for ratings that align with current preferences
      const ratingAlignment = this.calculateRatingAlignment(event, oldProfile);
      confidenceChange += ratingAlignment * 0.01;

      // Confidence boost for learning phase progression
      if (newProfile.learningPhase !== oldProfile.learningPhase) {
        confidenceChange += 0.05;
      }
    }

    return Math.min(0.1, Math.max(-0.05, confidenceChange));
  }

  // Calculate how well a rating aligns with current preferences
  private static calculateRatingAlignment(
    _event: LearningEvent,
    _profile: UserProfile
  ): number {
    // This would need content details to calculate alignment
    // For now, return a neutral value
    return 0.5;
  }

  // Determine if neural network should be retrained
  private static shouldRetrainNeuralNetwork(
    event: LearningEvent,
    allRatings: UserRating[]
  ): boolean {
    if (!this.config.enableNeuralRetraining) return false;

    const validRatings = allRatings.filter(r => typeof r.rating === 'number');
    
    // Retrain if we have enough data and it's been a while
    if (validRatings.length >= 20) {
      const lastEvent = this.learningEvents[this.learningEvents.length - 2]; // Previous event
      if (lastEvent) {
        const timeSinceLastRetrain = event.timestamp - lastEvent.timestamp;
        const hoursSinceLastRetrain = timeSinceLastRetrain / (1000 * 60 * 60);
        
        // Retrain every 24 hours or after significant rating changes
        return hoursSinceLastRetrain >= 24 || this.isSignificantRatingChange(event);
      }
    }

    return false;
  }

  // Check if the rating change is significant enough to warrant retraining
  private static isSignificantRatingChange(event: LearningEvent): boolean {
    if (event.type === 'rating_added' && typeof event.newRating === 'number') {
      // Consider extreme ratings as significant
      return event.newRating === 1 || event.newRating === 5;
    }
    
    if (event.type === 'rating_updated' && typeof event.oldRating === 'number' && typeof event.newRating === 'number') {
      // Consider rating changes of 2+ points as significant
      return Math.abs(event.newRating - event.oldRating) >= 2;
    }

    return false;
  }

  // Apply adaptive learning adjustments to profile
  private static applyAdaptiveLearningAdjustments(
    _profile: UserProfile,
    _event: LearningEvent,
    confidenceChange: number
  ): void {
    // Adjust learning rate based on confidence
    if (confidenceChange > 0) {
      this.config.learningRate = Math.min(0.2, this.config.learningRate + 0.01);
    } else if (confidenceChange < 0) {
      this.config.learningRate = Math.max(0.05, this.config.learningRate - 0.005);
    }

    // Save updated config
    this.saveConfig();
  }

  // Retrain neural network if needed
  static async retrainNeuralNetworkIfNeeded(
    shouldRetrain: boolean,
    allRatings: UserRating[],
    profile: UserProfile
  ): Promise<void> {
    if (!shouldRetrain) return;

    try {
      logger.info('Starting neural network retraining...');
      await NeuralRecommendationService.trainModel(allRatings, profile);
      logger.info('Neural network retraining completed');
    } catch (error) {
      logger.error('Neural network retraining failed:', error);
    }
  }

  // Get learning analytics
  static getLearningAnalytics(): {
    totalEvents: number;
    recentEvents: LearningEvent[];
    learningRate: number;
    averageConfidenceChange: number;
    mostActiveGenres: string[];
    learningPhase: string;
  } {
    const recentEvents = this.learningEvents
      .filter(event => Date.now() - event.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .slice(-50); // Last 50 events

    const confidenceChanges = recentEvents.map(_event => {
      // This would need to be calculated from actual events
      return 0.01; // Placeholder
    });

    const averageConfidenceChange = confidenceChanges.length > 0 
      ? confidenceChanges.reduce((sum, change) => sum + change, 0) / confidenceChanges.length 
      : 0;

    // Extract most active genres from recent events
    const genreActivity: Record<string, number> = {};
    recentEvents.forEach(_event => {
      // This would need content details to extract genres
      // For now, use placeholder
      genreActivity['action'] = (genreActivity['action'] || 0) + 1;
    });

    const mostActiveGenres = Object.entries(genreActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    return {
      totalEvents: this.learningEvents.length,
      recentEvents,
      learningRate: this.config.learningRate,
      averageConfidenceChange,
      mostActiveGenres,
      learningPhase: 'optimizing' // This would come from current profile
    };
  }

  // Update adaptive learning configuration
  static updateConfig(newConfig: Partial<AdaptiveLearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    logger.info('Adaptive learning configuration updated');
  }

  // Get current configuration
  static getConfig(): AdaptiveLearningConfig {
    return { ...this.config };
  }

  // Add learning event to history
  private static addLearningEvent(event: LearningEvent): void {
    this.learningEvents.push(event);
    
    // Keep only recent events to prevent memory issues
    if (this.learningEvents.length > this.config.maxLearningEvents) {
      this.learningEvents = this.learningEvents.slice(-this.config.maxLearningEvents);
    }
    
    this.saveLearningEvents();
  }

  // Load learning events from storage
  private static loadLearningEvents(): void {
    try {
      const saved = localStorage.getItem(this.LEARNING_EVENTS_KEY);
      if (saved) {
        this.learningEvents = JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Failed to load learning events:', error);
      this.learningEvents = [];
    }
  }

  // Save learning events to storage
  private static saveLearningEvents(): void {
    try {
      localStorage.setItem(this.LEARNING_EVENTS_KEY, JSON.stringify(this.learningEvents));
    } catch (error) {
      logger.error('Failed to save learning events:', error);
    }
  }

  // Load configuration from storage
  private static loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.ADAPTIVE_CONFIG_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      logger.error('Failed to load adaptive config:', error);
    }
  }

  // Save configuration to storage
  private static saveConfig(): void {
    try {
      localStorage.setItem(this.ADAPTIVE_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      logger.error('Failed to save adaptive config:', error);
    }
  }

  // Clear learning history
  static clearLearningHistory(): void {
    this.learningEvents = [];
    this.saveLearningEvents();
    logger.info('Learning history cleared');
  }

  // Get learning insights for display
  static getLearningInsights(profile: UserProfile, recentRatings: UserRating[]): {
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.5;

    // Analyze recent rating patterns
    const recentValidRatings = recentRatings
      .filter(r => typeof r.rating === 'number')
      .slice(-10); // Last 10 ratings

    if (recentValidRatings.length > 0) {
      const averageRecentRating = recentValidRatings.reduce((sum, r) => sum + (r.rating as number), 0) / recentValidRatings.length;
      
      if (averageRecentRating > profile.averageScore + 0.5) {
        insights.push('Son puanlamalarınız ortalamanızın üzerinde - kalite tercihleriniz artıyor');
        confidence += 0.1;
      } else if (averageRecentRating < profile.averageScore - 0.5) {
        insights.push('Son puanlamalarınız ortalamanızın altında - daha seçici hale geliyorsunuz');
        confidence += 0.05;
      }

      // Analyze rating consistency
      const ratingVariance = this.calculateRatingVariance(recentValidRatings);
      if (ratingVariance < 1.0) {
        insights.push('Tutarlı puanlama alışkanlığınız var - güvenilir öneriler sunabiliriz');
        confidence += 0.15;
      }
    }

    // Learning phase insights
    switch (profile.learningPhase) {
      case 'profiling':
        insights.push('Profil geliştirme aşamasındasınız - daha fazla içerik puanlayın');
        recommendations.push('Farklı türlerde içerik puanlayarak profil çeşitliliğinizi artırın');
        break;
      case 'testing':
        insights.push('Test aşamasındasınız - öneri doğruluğu ölçülüyor');
        recommendations.push('Beklenmedik içerikleri de puanlayarak sisteminizi test edin');
        break;
      case 'optimizing':
        insights.push('Optimizasyon aşamasındasınız - sistem sürekli öğreniyor');
        recommendations.push('Detaylı puanlamalar yaparak öneri kalitesini artırın');
        confidence += 0.2;
        break;
    }

    // Genre diversity insights
    const genreCount = Object.keys(profile.genreDistribution).length;
    if (genreCount < 10) {
      insights.push('Az sayıda tür keşfettiniz - çeşitliliği artırmayı deneyin');
      recommendations.push('Yeni türlerde içerik puanlayarak keşif alanınızı genişletin');
    } else if (genreCount > 20) {
      insights.push('Geniş bir tür yelpazesinde deneyiminiz var');
      confidence += 0.1;
    }

    return {
      insights: insights.slice(0, 3),
      recommendations: recommendations.slice(0, 2),
      confidence: Math.min(1, Math.max(0, confidence))
    };
  }

  // Calculate variance in ratings
  private static calculateRatingVariance(ratings: UserRating[]): number {
    if (ratings.length < 2) return 0;

    const values = ratings.map(r => r.rating as number);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  // Puanlanmış içeriklerle öğrenmeyi başlat
  static replayRatingsAsLearningEvents(ratings: UserRating[]): void {
    this.learningEvents = [];
    const baseTimestamp = Date.now();
    ratings.forEach((rating, idx) => {
      if (typeof rating.rating === 'number') {
        const event: LearningEvent = {
          type: 'rating_added',
          contentId: rating.movieId,
          newRating: rating.rating,
          mediaType: rating.mediaType || 'movie',
          timestamp: baseTimestamp + idx * 1000 // Her olaya 1 saniye ekle
        };
        this.learningEvents.push(event);
      }
    });
    this.saveLearningEvents();
    logger.info('Learning events replayed from rated content');
  }
}