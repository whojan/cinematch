import type { UserRating, UserProfile, Movie, TVShow, Genre } from '../types';
import { tmdbService } from '../../content/services/tmdb';
import { LearningService } from '../../learning/services/learningService';
import { NeuralRecommendationService } from '../../recommendation/services/neuralRecommendationService';

export class ProfileService {
  static async generateProfile(ratings: UserRating[]): Promise<UserProfile | null> {
    // Sadece gerçek puanları (1-10) dikkate al, istenmeyen ve atlanan içerikleri hariç tut
    const validRatings = ratings.filter(r => 
      typeof r.rating === 'number' && 
      r.rating >= 1 && 
      r.rating <= 10
    );
    
    if (validRatings.length < 5) return null;

    console.log('Generating profile for', validRatings.length, 'valid ratings');

    // Hem film hem dizi detaylarını al
    const contentDetails = await Promise.all(
      validRatings.map(async (rating) => {
        try {
          let content;
          if (rating.mediaType === 'tv') {
            content = await tmdbService.getTVShowDetails(rating.movieId);
          } else {
            content = await tmdbService.getMovieDetails(rating.movieId);
          }
          
          if (content) {
            console.log(`Content ${rating.movieId} genres:`, content.genre_ids || content.genres?.map(g => g.id));
            return { 
              content, 
              rating: rating.rating as number, 
              mediaType: rating.mediaType || 'movie',
              tmdbRating: content.vote_average || 0
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching content ${rating.movieId}:`, error);
          return null;
        }
      })
    );

    const validContent = contentDetails.filter(item => item !== null) as Array<{ 
      content: Movie | TVShow; 
      rating: number; 
      mediaType: 'movie' | 'tv';
      tmdbRating: number;
    }>;
    
    console.log('Valid content for profile:', validContent.length);
    
    if (validContent.length < 5) return null;

    const learningPhase = LearningService.determineLearningPhase(ratings);

    const profile: UserProfile = {
      genreDistribution: {},
      genreQualityDistribution: {},
      periodPreference: {},
      tempoPreference: {},
      favoriteActors: {},
      favoriteDirectors: {},
      averageScore: 0,
      totalRatings: validRatings.length,
      learningPhase,
      lastUpdated: Date.now()
    };

    // Calculate average score (1-10 sistem)
    profile.averageScore = validRatings.reduce((sum, rating) => sum + (rating.rating as number), 0) / validRatings.length;

    // Analyze genre distribution with quality awareness
    const genreRatings: { [genreId: number]: { userRatings: number[], tmdbRatings: number[] } } = {};
    
    validContent.forEach(({ content, rating, tmdbRating }) => {
      let genreIds: number[] = [];
      
      // Genre ID'leri al (hem genre_ids hem de genres array'ini kontrol et)
      if (content.genre_ids && content.genre_ids.length > 0) {
        genreIds = content.genre_ids;
      } else if (content.genres && content.genres.length > 0) {
        genreIds = content.genres.map(g => g.id);
      }
      
      console.log(`Content ${content.id} has genres:`, genreIds);
      
      genreIds.forEach(genreId => {
        if (!genreRatings[genreId]) {
          genreRatings[genreId] = { userRatings: [], tmdbRatings: [] };
        }
        genreRatings[genreId].userRatings.push(rating);
        genreRatings[genreId].tmdbRatings.push(tmdbRating);
      });
    });

    console.log('Genre ratings collected:', genreRatings);

    // Calculate genre preferences with quality awareness
    const totalRatings = validContent.length;
    Object.entries(genreRatings).forEach(([genreId, data]) => {
      const avgUserRating = data.userRatings.reduce((sum, r) => sum + r, 0) / data.userRatings.length;
      const avgTmdbRating = data.tmdbRatings.reduce((sum, r) => sum + r, 0) / data.tmdbRatings.length;
      const frequency = data.userRatings.length / totalRatings;
      
      // Quality-aware preference calculation
      // Kullanıcının düşük kaliteli içeriğe yüksek puan vermesi türü sevdiğini gösterir
      // Yüksek kaliteli içeriğe düşük puan vermesi türü sevmediğini gösterir
      const qualityAdjustment = this.calculateQualityAdjustment(avgUserRating, avgTmdbRating);
      
      // Preference score: (average rating / 10) * frequency * 100 * quality adjustment
      const preferenceScore = (avgUserRating / 10) * frequency * 100 * qualityAdjustment;
      
      profile.genreDistribution[parseInt(genreId)] = preferenceScore;
      
      // Store quality-aware genre data
      profile.genreQualityDistribution[parseInt(genreId)] = {
        averageQuality: avgTmdbRating,
        averagePreference: avgUserRating,
        count: data.userRatings.length
      };
      
      console.log(`Genre ${genreId}: user=${avgUserRating.toFixed(2)}, tmdb=${avgTmdbRating.toFixed(2)}, freq=${frequency.toFixed(2)}, quality_adj=${qualityAdjustment.toFixed(2)}, score=${preferenceScore.toFixed(2)}`);
    });

    // Normalize genre distribution to percentages
    const totalPreference = Object.values(profile.genreDistribution).reduce((sum, pref) => sum + pref, 0);
    if (totalPreference > 0) {
      Object.keys(profile.genreDistribution).forEach(genreId => {
        const normalizedScore = (profile.genreDistribution[parseInt(genreId)] / totalPreference) * 100;
        profile.genreDistribution[parseInt(genreId)] = normalizedScore;
        console.log(`Genre ${genreId} normalized: ${normalizedScore.toFixed(2)}%`);
      });
    }

    console.log('Final genre distribution:', profile.genreDistribution);

    // Analyze period preference
    const periodRatings: { [decade: string]: number[] } = {};
    validContent.forEach(({ content, rating }) => {
      let releaseDate;
      if ('release_date' in content) {
        releaseDate = content.release_date;
      } else if ('first_air_date' in content) {
        releaseDate = content.first_air_date;
      }
      
      if (releaseDate) {
        const year = new Date(releaseDate).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        
        if (!periodRatings[decade]) {
          periodRatings[decade] = [];
        }
        periodRatings[decade].push(rating);
      }
    });

    Object.entries(periodRatings).forEach(([decade, ratings]) => {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const frequency = ratings.length / totalRatings;
      const preferenceScore = (avgRating / 10) * frequency * 100;
      profile.periodPreference[decade] = preferenceScore;
    });

    // Normalize period preferences
    const totalPeriodPreference = Object.values(profile.periodPreference).reduce((sum, pref) => sum + pref, 0);
    if (totalPeriodPreference > 0) {
      Object.keys(profile.periodPreference).forEach(decade => {
        profile.periodPreference[decade] = (profile.periodPreference[decade] / totalPeriodPreference) * 100;
      });
    }

    // Analyze favorite actors and directors
    validContent.forEach(({ content, rating }) => {
      // Top 3 cast members
      if (content.credits?.cast) {
        content.credits.cast.slice(0, 3).forEach(actor => {
          if (!profile.favoriteActors[actor.id]) {
            profile.favoriteActors[actor.id] = { name: actor.name, count: 0 };
          }
          profile.favoriteActors[actor.id].count += rating;
        });
      }

      // Directors
      if (content.credits?.crew) {
        content.credits.crew.filter(member => member.job === 'Director').forEach(director => {
          if (!profile.favoriteDirectors[director.id]) {
            profile.favoriteDirectors[director.id] = { name: director.name, count: 0 };
          }
          profile.favoriteDirectors[director.id].count += rating;
        });
      }
    });

    // Test aşamasındaysa doğruluk oranını hesapla
    if (learningPhase === 'testing' || learningPhase === 'optimizing') {
      profile.accuracyScore = LearningService.calculateAccuracy(ratings, profile);
    }

    // Neural network modelini eğit (yeterli veri varsa)
    if (validContent.length >= 20) {
      try {
        await NeuralRecommendationService.trainModel(ratings, profile);
        console.log('Neural network model trained successfully');
      } catch (error) {
        console.warn('Neural network training failed:', error);
      }
    }

    console.log('Generated profile:', profile);
    return profile;
  }

  // Kalite ayarlaması hesaplama (1-10 sistem için güncellendi)
  private static calculateQualityAdjustment(userRating: number, tmdbRating: number): number {
    // TMDb puanı zaten 1-10 skalasında
    const normalizedTmdbRating = tmdbRating;
    
    // Kullanıcı puanı ile TMDb puanı arasındaki fark
    const ratingDiff = userRating - normalizedTmdbRating;
    
    // Eğer kullanıcı düşük kaliteli içeriğe yüksek puan verdiyse, türü gerçekten seviyor demektir
    // Eğer yüksek kaliteli içeriğe düşük puan verdiyse, türü sevmiyor demektir
    
    if (ratingDiff > 2) {
      // Düşük kaliteli içeriğe yüksek puan = tür sevgisi güçlü
      return 1.2;
    } else if (ratingDiff < -2) {
      // Yüksek kaliteli içeriğe düşük puan = tür sevgisi zayıf
      return 0.8;
    } else {
      // Normal durum
      return 1.0;
    }
  }

  static generateProfileDescription(profile: UserProfile, genres: Genre[]): string {
    const topGenres = Object.entries(profile.genreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genreId]) => {
        const genre = genres.find(g => g.id === parseInt(genreId));
        return genre?.name || 'Bilinmeyen';
      });

    const topPeriod = Object.entries(profile.periodPreference)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '2000s';

    const topActors = Object.values(profile.favoriteActors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(actor => actor.name);

    const avgScore = profile.averageScore.toFixed(1);
    const phaseDescription = LearningService.generatePhaseDescription(profile.learningPhase, profile.totalRatings);

    let description = `${phaseDescription}\n\n`;

    if (topGenres.length > 0) {
      description += `${topGenres.join(', ')} türlerinde yapımlara yoğunlaşıyorsun. `;
    }

    description += `${topPeriod} dönemi filmleri tercih ediyorsun ve ortalama ${avgScore} puan veriyorsun. `;

    if (topActors.length > 0) {
      description += `${topActors.join(' ve ')} gibi oyuncuların filmlerini özellikle seviyorsun.`;
    }

    const tempo = Object.entries(profile.tempoPreference).sort(([, a], [, b]) => b - a)[0];
    if (tempo) {
      const tempoDesc = tempo[0] === 'fast-paced' ? 'tempolu' : 'sakin';
      description += ` ${tempoDesc.charAt(0).toUpperCase() + tempoDesc.slice(1)} anlatımlı yapımlar senin tarzın.`;
    }

    // Test aşaması bilgisi
    if (profile.learningPhase === 'testing' && profile.accuracyScore) {
      description += `\n\nTest aşamasında %${profile.accuracyScore.toFixed(1)} doğruluk oranına ulaştım!`;
    }

    // Kalite farkındalığı bilgisi
    if (profile.genreQualityDistribution) {
      const qualityAwareGenres = Object.entries(profile.genreQualityDistribution)
        .filter(([, data]) => Math.abs(data.averagePreference - data.averageQuality) > 1)
        .length;
      
      if (qualityAwareGenres > 0) {
        description += `\n\nİçerik kalitesini değerlendirmede tutarlı bir yaklaşımın var.`;
      }
    }

    return description;
  }
}