import type { UserRating, UserProfile, Movie, TVShow, LearningMetrics } from '../types';
import { tmdbService } from '../../content/services/tmdb';

export class LearningService {
  private static readonly PHASE_THRESHOLDS = {
    PROFILING: 50,  // 50 içerik sonrası test aşamasına geç
    TESTING: 20,    // 20 test içeriği sonrası optimizasyon aşamasına geç
    OPTIMIZING: 100 // 100+ içerik ile sürekli optimizasyon
  };

  static determineLearningPhase(ratings: UserRating[]): UserProfile['learningPhase'] {
    const validRatings = ratings.filter(r => r.rating !== 'not_watched');
    const totalRatings = validRatings.length;

    if (totalRatings < 5) return 'initial';
    if (totalRatings < this.PHASE_THRESHOLDS.PROFILING) return 'profiling';
    if (totalRatings < this.PHASE_THRESHOLDS.PROFILING + this.PHASE_THRESHOLDS.TESTING) return 'testing';
    return 'optimizing';
  }

  static async generateTestRecommendations(
    profile: UserProfile, 
    movieGenres: any[], 
    tvGenres: any[],
    existingRatings: UserRating[] = [],
    progressCallback?: (progress: { current: number; total: number; message: string }) => void
  ): Promise<(Movie | TVShow)[]> {
    const testContent: (Movie | TVShow)[] = [];
    const ratedContentIds = new Set(existingRatings.map(r => r.movieId));
    
    // Kullanıcının sevdiği türlerden farklı kalite seviyelerinde içerikler seç
    const topGenres = Object.entries(profile.genreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Daha fazla tür dene
      .map(([genreId]) => parseInt(genreId));

    const totalSteps = topGenres.length * 4; // Her tür için 2 film + 2 dizi
    let currentStep = 0;

    for (const genreId of topGenres) {
      // Film - Yüksek kalite
      progressCallback?.({ 
        current: ++currentStep, 
        total: totalSteps, 
        message: `Yüksek kaliteli ${this.getGenreName(genreId, [...movieGenres, ...tvGenres])} filmleri aranıyor...` 
      });
      
      const highQualityMovie = await this.getTestMovieByQuality(genreId, 8.0, 9.0, ratedContentIds);
      if (highQualityMovie) {
        highQualityMovie.media_type = 'movie';
        testContent.push(highQualityMovie);
        ratedContentIds.add(highQualityMovie.id);
      }

      // Film - Orta kalite
      progressCallback?.({ 
        current: ++currentStep, 
        total: totalSteps, 
        message: `Orta kaliteli ${this.getGenreName(genreId, [...movieGenres, ...tvGenres])} filmleri aranıyor...` 
      });
      
      const mediumQualityMovie = await this.getTestMovieByQuality(genreId, 6.5, 7.5, ratedContentIds);
      if (mediumQualityMovie) {
        mediumQualityMovie.media_type = 'movie';
        testContent.push(mediumQualityMovie);
        ratedContentIds.add(mediumQualityMovie.id);
      }

      // Dizi - Yüksek kalite
      progressCallback?.({ 
        current: ++currentStep, 
        total: totalSteps, 
        message: `Yüksek kaliteli ${this.getGenreName(genreId, [...movieGenres, ...tvGenres])} dizileri aranıyor...` 
      });
      
      const highQualityTV = await this.getTestTVShowByQuality(genreId, 8.0, 9.0, ratedContentIds);
      if (highQualityTV) {
        highQualityTV.media_type = 'tv';
        testContent.push(highQualityTV);
        ratedContentIds.add(highQualityTV.id);
      }

      // Dizi - Orta kalite
      progressCallback?.({ 
        current: ++currentStep, 
        total: totalSteps, 
        message: `Orta kaliteli ${this.getGenreName(genreId, [...movieGenres, ...tvGenres])} dizileri aranıyor...` 
      });
      
      const mediumQualityTV = await this.getTestTVShowByQuality(genreId, 6.5, 7.5, ratedContentIds);
      if (mediumQualityTV) {
        mediumQualityTV.media_type = 'tv';
        testContent.push(mediumQualityTV);
        ratedContentIds.add(mediumQualityTV.id);
      }
    }

    // Eğer yeterli içerik yoksa, popüler içeriklerden ekle
    if (testContent.length < 15) {
      progressCallback?.({ 
        current: totalSteps, 
        total: totalSteps, 
        message: 'Popüler içeriklerden ek test materyali aranıyor...' 
      });
      
      await this.addPopularTestContent(testContent, ratedContentIds, 15 - testContent.length);
    }

    progressCallback?.({ 
      current: totalSteps, 
      total: totalSteps, 
      message: 'Test içerikleri hazırlandı!' 
    });

    return testContent.slice(0, 15);
  }

  private static async addPopularTestContent(testContent: (Movie | TVShow)[], ratedContentIds: Set<number>, count: number): Promise<void> {
    const sortOptions = ['vote_average.desc', 'popularity.desc', 'vote_count.desc'];
    
    for (let attempt = 0; attempt < 10 && testContent.length < count + testContent.length; attempt++) {
      try {
        const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
        const randomPage = Math.floor(Math.random() * 5) + 1;
        
        // Film veya dizi seç (50-50 şans)
        if (Math.random() > 0.5) {
          // Film
          const response = await tmdbService.discoverMovies({
            'vote_average.gte': 6.0,
            'vote_count.gte': 200,
            sort_by: randomSort,
            page: randomPage
          });

          const availableMovies = response.results.filter(
            movie => !ratedContentIds.has(movie.id)
          );
          
          for (const movie of availableMovies) {
            if (testContent.length >= count + testContent.length) break;
            movie.media_type = 'movie';
            testContent.push(movie);
            ratedContentIds.add(movie.id);
          }
        } else {
          // Dizi
          const response = await tmdbService.discoverTVShows({
            'vote_average.gte': 6.0,
            'vote_count.gte': 100,
            sort_by: randomSort,
            page: randomPage
          });

          const availableShows = response.results.filter(
            show => !ratedContentIds.has(show.id)
          );
          
          for (const show of availableShows) {
            if (testContent.length >= count + testContent.length) break;
            show.media_type = 'tv';
            testContent.push(show);
            ratedContentIds.add(show.id);
          }
        }
      } catch (error) {
        console.error('Error fetching additional test content:', error);
      }
    }
  }

  private static getGenreName(genreId: number, genres: any[]): string {
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || 'İçerik';
  }

  private static async getTestMovieByQuality(genreId: number, minRating: number, maxRating: number, ratedContentIds: Set<number>): Promise<Movie | null> {
    // Birden fazla sayfa dene
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const response = await tmdbService.discoverMovies({
          with_genres: genreId.toString(),
          'vote_average.gte': minRating,
          'vote_average.lte': maxRating,
          'vote_count.gte': 100,
          sort_by: attempt % 2 === 0 ? 'vote_count.desc' : 'popularity.desc',
          page: Math.floor(Math.random() * 5) + 1
        });

        const availableMovies = response.results.filter(
          movie => movie.vote_average >= minRating && 
                   movie.vote_average <= maxRating && 
                   !ratedContentIds.has(movie.id)
        );
        
        if (availableMovies.length === 0) continue;

        const randomIndex = Math.floor(Math.random() * Math.min(8, availableMovies.length));
        return availableMovies[randomIndex];
      } catch (error) {
        console.error('Error fetching test movie:', error);
      }
    }
    
    return null;
  }

  private static async getTestTVShowByQuality(genreId: number, minRating: number, maxRating: number, ratedContentIds: Set<number>): Promise<TVShow | null> {
    // Birden fazla sayfa dene
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const response = await tmdbService.discoverTVShows({
          with_genres: genreId.toString(),
          'vote_average.gte': minRating,
          'vote_average.lte': maxRating,
          'vote_count.gte': 50,
          sort_by: attempt % 2 === 0 ? 'vote_count.desc' : 'popularity.desc',
          page: Math.floor(Math.random() * 5) + 1
        });

        const availableShows = response.results.filter(
          show => show.vote_average >= minRating && 
                  show.vote_average <= maxRating && 
                  !ratedContentIds.has(show.id)
        );
        
        if (availableShows.length === 0) continue;

        const randomIndex = Math.floor(Math.random() * Math.min(8, availableShows.length));
        return availableShows[randomIndex];
      } catch (error) {
        console.error('Error fetching test TV show:', error);
      }
    }
    
    return null;
  }

  static calculateAccuracy(ratings: UserRating[], profile: UserProfile): number {
    const testRatings = ratings.filter(r => r.timestamp > (profile.lastUpdated || 0) && r.rating !== 'not_watched');
    if (testRatings.length === 0) return 0;

    let correctPredictions = 0;
    
    testRatings.forEach(rating => {
      const predictedRating = this.predictRating(profile);
      const actualRating = rating.rating as number;
      
      // Tahmin doğruluğu: ±2 puan farkı kabul edilebilir (1-10 sistem için)
      if (Math.abs(predictedRating - actualRating) <= 2) {
        correctPredictions++;
      }
    });

    return (correctPredictions / testRatings.length) * 100;
  }

  private static predictRating(profile: UserProfile): number {
    // Basit tahmin algoritması - gerçek uygulamada daha karmaşık olabilir
    const baseRating = profile.averageScore;
    
    // Tür uyumuna göre ayarlama yapılabilir
    // Bu örnekte basit bir yaklaşım kullanıyoruz
    return Math.max(1, Math.min(10, Math.round(baseRating)));
  }

  static generatePhaseDescription(phase: UserProfile['learningPhase'], ratingsCount: number): string {
    switch (phase) {
      case 'initial':
        return `Zevkini öğrenmeye başlıyorum! ${ratingsCount}/5 içerik puanlandı.`;
      case 'profiling':
        return `Profilini detaylandırıyorum! ${ratingsCount}/50 içerik puanlandı. Farklı türlerden film ve diziler puanlayarak beni eğitmeye devam et.`;
      case 'testing':
        return `Test aşamasındayım! Önerilerimin doğruluğunu test ediyorum. ${ratingsCount - 50}/20 test içeriği puanlandı.`;
      case 'optimizing':
        return `Sürekli öğrenme modundayım! ${ratingsCount} içerik puanladın. Her yeni puanlama ile daha da akıllı oluyorum.`;
      default:
        return 'Öğrenme süreci devam ediyor...';
    }
  }

  static generateLearningInsights(profile: UserProfile, ratings: UserRating[]): string[] {
    const insights: string[] = [];
    const validRatings = ratings.filter(r => r.rating !== 'not_watched');

    // Puanlama davranışı analizi (1-10 sistem için güncellendi)
    const highRatings = validRatings.filter(r => (r.rating as number) >= 8).length;
    const lowRatings = validRatings.filter(r => (r.rating as number) <= 4).length;
    const totalValid = validRatings.length;

    if (highRatings / totalValid > 0.7) {
      insights.push('Genellikle yüksek puan verme eğilimindesin - seçici bir izleyicisin!');
    } else if (lowRatings / totalValid > 0.3) {
      insights.push('Eleştirel bir yaklaşımın var - kalite standartların yüksek!');
    }

    // Tür çeşitliliği analizi
    const ratedGenres = Object.keys(profile.genreDistribution).length;
    if (ratedGenres >= 8) {
      insights.push('Çok çeşitli türlerde içerik izliyorsun - açık fikirli bir sinema/dizi severin!');
    } else if (ratedGenres <= 3) {
      insights.push('Belirli türlere odaklanıyorsun - net tercihlerin var!');
    }

    // Medya türü analizi
    const movieRatings = validRatings.filter(r => r.mediaType === 'movie' || !r.mediaType).length;
    const tvRatings = validRatings.filter(r => r.mediaType === 'tv').length;
    
    if (tvRatings > movieRatings) {
      insights.push('Dizi izlemeyi film izlemeye tercih ediyorsun!');
    } else if (movieRatings > tvRatings * 2) {
      insights.push('Film odaklı bir izleyicisin - uzun soluklu hikayeler senin tarzın!');
    }

    if (profile.learningPhase === 'testing' && profile.accuracyScore) {
      insights.push(`Test aşamasında %${profile.accuracyScore.toFixed(1)} doğruluk oranına ulaştım!`);
    }

    return insights;
  }

  // Plan-Do-Check-Act döngüsü için metrikler
  static generatePDCAMetrics(ratings: UserRating[], profile: UserProfile): LearningMetrics {
    const validRatings = ratings.filter(r => r.rating !== 'not_watched');
    const phase = this.determineLearningPhase(ratings);
    
    return {
      phase,
      totalRatings: validRatings.length,
      accuracyScore: profile.accuracyScore || 0,
      testCorrectPredictions: 0, // Gerçek uygulamada hesaplanır
      testTotalPredictions: 0,   // Gerçek uygulamada hesaplanır
      lastPhaseChange: profile.lastUpdated || Date.now()
    };
  }
}