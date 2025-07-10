import type { UserProfile, Movie, TVShow, Genre, ContentFeatures } from '../../types';
import { logger } from '../logger';

interface ContentBasedRecommendation {
  contentId: number;
  score: number;
  matchingFeatures: string[];
}

interface GenreCombination {
  genres: number[];
  name: string;
  weight: number;
}

export class ContentBasedFiltering {
  // Popüler tür kombinasyonları ve ağırlıkları
  private static readonly GENRE_COMBINATIONS: GenreCombination[] = [
    // İkili kombinasyonlar
    { genres: [28, 878], name: 'Aksiyon + Bilim Kurgu', weight: 1.3 },
    { genres: [35, 18], name: 'Komedi + Dram', weight: 1.2 },
    { genres: [27, 53], name: 'Korku + Gerilim', weight: 1.4 },
    { genres: [10749, 35], name: 'Romantik + Komedi', weight: 1.2 },
    { genres: [28, 12], name: 'Aksiyon + Macera', weight: 1.3 },
    { genres: [18, 80], name: 'Dram + Suç', weight: 1.3 },
    { genres: [14, 12], name: 'Fantastik + Macera', weight: 1.2 },
    { genres: [878, 53], name: 'Bilim Kurgu + Gerilim', weight: 1.3 },
    { genres: [16, 10751], name: 'Animasyon + Aile', weight: 1.1 },
    { genres: [18, 10749], name: 'Dram + Romantik', weight: 1.2 },
    { genres: [28, 80], name: 'Aksiyon + Suç', weight: 1.3 },
    { genres: [35, 10749], name: 'Komedi + Romantik', weight: 1.2 },
    { genres: [14, 18], name: 'Fantastik + Dram', weight: 1.2 },
    { genres: [27, 9648], name: 'Korku + Gizem', weight: 1.3 },
    { genres: [12, 10751], name: 'Macera + Aile', weight: 1.1 },
    
    // Üçlü kombinasyonlar (daha yüksek ağırlık)
    { genres: [28, 12, 878], name: 'Aksiyon + Macera + Bilim Kurgu', weight: 1.5 },
    { genres: [35, 18, 10749], name: 'Komedi + Dram + Romantik', weight: 1.4 },
    { genres: [27, 53, 9648], name: 'Korku + Gerilim + Gizem', weight: 1.6 },
    { genres: [14, 12, 28], name: 'Fantastik + Macera + Aksiyon', weight: 1.5 },
    { genres: [18, 80, 53], name: 'Dram + Suç + Gerilim', weight: 1.4 },
    { genres: [16, 35, 10751], name: 'Animasyon + Komedi + Aile', weight: 1.3 },
    { genres: [878, 28, 53], name: 'Bilim Kurgu + Aksiyon + Gerilim', weight: 1.5 },
    { genres: [10749, 35, 18], name: 'Romantik + Komedi + Dram', weight: 1.3 }
  ];

  static extractContentFeatures(content: Movie | TVShow): ContentFeatures {
    const releaseDate = 'release_date' in content ? content.release_date : content.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 0;

    return {
      genres: content.genre_ids || [],
      cast: content.credits?.cast?.slice(0, 5).map(actor => actor.id) || [],
      crew: content.credits?.crew?.filter(member => member.job === 'Director').map(director => director.id) || [],
      year,
      rating: content.vote_average || 0,
      popularity: content.vote_count || 0
    };
  }

  static calculateGenreCombinationScore(
    userProfile: UserProfile,
    contentGenres: number[]
  ): { score: number; matchedCombinations: string[] } {
    let combinationScore = 0;
    const matchedCombinations: string[] = [];
    // Güvenli kontroller
    const safeGenreDistribution = (userProfile && typeof userProfile.genreDistribution === 'object') ? userProfile.genreDistribution : {};
    // Kullanıcının en çok sevdiği türleri al
    const userTopGenres = Object.entries(safeGenreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8) // Top 8 genre
      .map(([genreId, score]) => ({ id: parseInt(genreId), score }));

    // Her kombinasyon için kontrol et
    for (const combination of this.GENRE_COMBINATIONS) {
      // İçeriğin bu kombinasyona sahip olup olmadığını kontrol et
      const hasAllGenres = combination.genres.every(genreId => 
        contentGenres.includes(genreId)
      );

      if (hasAllGenres) {
        // Kullanıcının bu türlerdeki ortalama tercihini hesapla
        let userPreferenceSum = 0;
        let genreCount = 0;

        for (const genreId of combination.genres) {
          const userGenre = userTopGenres.find(ug => ug.id === genreId);
          if (userGenre) {
            userPreferenceSum += userGenre.score;
            genreCount++;
          }
        }

        if (genreCount > 0) {
          const averagePreference = userPreferenceSum / genreCount;
          // Kombinasyon skoru = ortalama tercih * kombinasyon ağırlığı * tür sayısı bonusu
          const comboScore = (averagePreference / 100) * combination.weight * (combination.genres.length * 0.2);
          combinationScore += comboScore;
          matchedCombinations.push(combination.name);
          
          logger.debug(`Genre combination match: ${combination.name}, score: ${comboScore.toFixed(3)}`);
        }
      }
    }

    return { score: combinationScore, matchedCombinations };
  }

  static calculateContentSimilarity(
    userProfile: UserProfile,
    contentFeatures: ContentFeatures
  ): number {
    let totalScore = 0;
    let weightSum = 0;
    // Güvenli kontroller
    const safeGenreDistribution = (userProfile && typeof userProfile.genreDistribution === 'object') ? userProfile.genreDistribution : {};
    const safeFavoriteActors = (userProfile && typeof userProfile.favoriteActors === 'object') ? userProfile.favoriteActors : {};
    const safeFavoriteDirectors = (userProfile && typeof userProfile.favoriteDirectors === 'object') ? userProfile.favoriteDirectors : {};
    const safePeriodPreference = (userProfile && typeof userProfile.periodPreference === 'object') ? userProfile.periodPreference : {};
    const safeAverageScore = typeof userProfile.averageScore === 'number' ? userProfile.averageScore : 0;
    // 1. Tür kombinasyonu skoru (35% ağırlık) - YENİ!
    const combinationWeight = 0.35;
    const { score: combinationScore } = this.calculateGenreCombinationScore(
      userProfile, 
      contentFeatures.genres
    );
    
    if (combinationScore > 0) {
      totalScore += combinationScore * combinationWeight;
      weightSum += combinationWeight;
      logger.debug(`Combination score: ${combinationScore.toFixed(3)}`);
    }

    // 2. Tekil tür benzerliği (25% ağırlık) - Azaltıldı
    const genreWeight = 0.25;
    let genreScore = 0;
    let genreCount = 0;

    for (const genreId of contentFeatures.genres) {
      const userPreference = safeGenreDistribution[genreId] || 0;
      genreScore += userPreference / 100;
      genreCount++;
    }

    if (genreCount > 0) {
      genreScore = genreScore / genreCount;
      totalScore += genreScore * genreWeight;
      weightSum += genreWeight;
    }

    // 3. Oyuncu benzerliği (20% ağırlık) - Azaltıldı
    const actorWeight = 0.2;
    let actorScore = 0;
    let actorCount = 0;

    for (const actorId of contentFeatures.cast) {
      const userPreference = safeFavoriteActors[actorId];
      if (userPreference) {
        actorScore += Math.min(1, userPreference.count / 10);
        actorCount++;
      }
    }

    if (actorCount > 0) {
      actorScore = actorScore / actorCount;
      totalScore += actorScore * actorWeight;
      weightSum += actorWeight;
    }

    // 4. Yönetmen benzerliği (10% ağırlık) - Azaltıldı
    const directorWeight = 0.1;
    let directorScore = 0;
    let directorCount = 0;

    for (const directorId of contentFeatures.crew) {
      const userPreference = safeFavoriteDirectors[directorId];
      if (userPreference) {
        directorScore += Math.min(1, userPreference.count / 5);
        directorCount++;
      }
    }

    if (directorCount > 0) {
      directorScore = directorScore / directorCount;
      totalScore += directorScore * directorWeight;
      weightSum += directorWeight;
    }

    // 5. Dönem benzerliği (7% ağırlık) - Azaltıldı
    const periodWeight = 0.07;
    if (contentFeatures.year > 0) {
      const decade = `${Math.floor(contentFeatures.year / 10) * 10}s`;
      const periodPreference = safePeriodPreference[decade] || 0;
      const periodScore = periodPreference / 100;
      totalScore += periodScore * periodWeight;
      weightSum += periodWeight;
    }

    // 6. Kalite benzerliği (3% ağırlık) - Azaltıldı
    const qualityWeight = 0.03;
    const qualityDiff = Math.abs(contentFeatures.rating - safeAverageScore * 2);
    const qualityScore = Math.max(0, 1 - qualityDiff / 10);
    totalScore += qualityScore * qualityWeight;
    weightSum += qualityWeight;

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    
    logger.debug(`Content similarity calculation:`, {
      combinationScore: combinationScore.toFixed(3),
      genreScore: genreScore.toFixed(3),
      actorScore: actorScore.toFixed(3),
      finalScore: finalScore.toFixed(3)
    });

    return finalScore;
  }

  static generateRecommendations(
    userProfile: UserProfile,
    candidateContent: (Movie | TVShow)[],
    genres: Genre[]
  ): ContentBasedRecommendation[] {
    logger.debug('Generating enhanced content-based filtering recommendations with genre combinations');

    const recommendations: ContentBasedRecommendation[] = [];

    for (const content of candidateContent) {
      const features = this.extractContentFeatures(content);
      const similarity = this.calculateContentSimilarity(userProfile, features);

      if (similarity > 0.1) { // Minimum threshold
        const matchingFeatures = this.getMatchingFeatures(userProfile, features, genres);
        
        recommendations.push({
          contentId: content.id,
          score: similarity,
          matchingFeatures
        });
      }
    }

    // Sort by similarity score
    recommendations.sort((a, b) => b.score - a.score);

    logger.debug(`Generated ${recommendations.length} enhanced content-based recommendations`);
    return recommendations.slice(0, 20);
  }

  private static getMatchingFeatures(
    userProfile: UserProfile,
    contentFeatures: ContentFeatures,
    genres: Genre[]
  ): string[] {
    const features: string[] = [];

    // Tür kombinasyonu eşleşmeleri - YENİ!
    const { matchedCombinations } = this.calculateGenreCombinationScore(
      userProfile, 
      contentFeatures.genres
    );

    if (matchedCombinations.length > 0) {
      features.push(`Sevdiğin kombinasyonlar: ${matchedCombinations.join(', ')}`);
    }

    // Tekil tür eşleşmeleri
    const topUserGenres = Object.entries(userProfile.genreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genreId]) => parseInt(genreId));

    const matchingGenres = contentFeatures.genres.filter(genreId => 
      topUserGenres.includes(genreId)
    );

    if (matchingGenres.length > 0 && matchedCombinations.length === 0) {
      // Sadece kombinasyon yoksa tekil türleri göster
      const genreNames = matchingGenres.map(genreId => {
        const genre = genres.find(g => g.id === genreId);
        return genre?.name || 'Bilinmeyen';
      });
      features.push(`Sevdiğin türler: ${genreNames.join(', ')}`);
    }

    // Oyuncu eşleşmeleri
    const matchingActors = contentFeatures.cast.filter(actorId => 
      userProfile.favoriteActors[actorId]
    );

    if (matchingActors.length > 0) {
      const actorNames = matchingActors.map(actorId => 
        userProfile.favoriteActors[actorId].name
      );
      features.push(`Favori oyuncular: ${actorNames.join(', ')}`);
    }

    // Yönetmen eşleşmeleri
    const matchingDirectors = contentFeatures.crew.filter(directorId => 
      userProfile.favoriteDirectors[directorId]
    );

    if (matchingDirectors.length > 0) {
      const directorNames = matchingDirectors.map(directorId => 
        userProfile.favoriteDirectors[directorId].name
      );
      features.push(`Favori yönetmenler: ${directorNames.join(', ')}`);
    }

    // Dönem tercihi
    if (contentFeatures.year > 0) {
      const decade = `${Math.floor(contentFeatures.year / 10) * 10}s`;
      const periodPreference = userProfile.periodPreference[decade] || 0;
      if (periodPreference > 15) {
        features.push(`Sevdiğin dönem: ${decade}`);
      }
    }

    // Kalite eşleşmesi
    const expectedRating = userProfile.averageScore * 2;
    const ratingDiff = Math.abs(contentFeatures.rating - expectedRating);
    if (ratingDiff < 1) {
      features.push(`Kalite tercihin: ${contentFeatures.rating.toFixed(1)}/10`);
    }

    return features;
  }

  // Kullanıcının tür kombinasyonu tercihlerini analiz et
  static analyzeUserGenreCombinations(profile: UserProfile): GenreCombination[] {
    const safeGenreDistribution = (profile && typeof profile.genreDistribution === 'object') ? profile.genreDistribution : {};
    const userCombinations: GenreCombination[] = [];
    
    // Kullanıcının en çok sevdiği türleri al
    const topGenres = Object.entries(safeGenreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([genreId, score]) => ({ id: parseInt(genreId), score }));

    // İkili kombinasyonları oluştur
    for (let i = 0; i < topGenres.length; i++) {
      for (let j = i + 1; j < topGenres.length; j++) {
        const genre1 = topGenres[i];
        const genre2 = topGenres[j];
        const combinedScore = (genre1.score + genre2.score) / 2;
        
        if (combinedScore > 10) { // Minimum threshold
          userCombinations.push({
            genres: [genre1.id, genre2.id],
            name: `Tür ${genre1.id} + Tür ${genre2.id}`,
            weight: combinedScore / 100
          });
        }
      }
    }

    // Üçlü kombinasyonları oluştur (sadece en yüksek skorlular için)
    for (let i = 0; i < Math.min(4, topGenres.length); i++) {
      for (let j = i + 1; j < Math.min(4, topGenres.length); j++) {
        for (let k = j + 1; k < Math.min(4, topGenres.length); k++) {
          const genre1 = topGenres[i];
          const genre2 = topGenres[j];
          const genre3 = topGenres[k];
          const combinedScore = (genre1.score + genre2.score + genre3.score) / 3;
          
          if (combinedScore > 15) { // Daha yüksek threshold
            userCombinations.push({
              genres: [genre1.id, genre2.id, genre3.id],
              name: `Tür ${genre1.id} + Tür ${genre2.id} + Tür ${genre3.id}`,
              weight: (combinedScore / 100) * 1.2 // Bonus for triple combinations
            });
          }
        }
      }
    }

    return userCombinations.sort((a, b) => b.weight - a.weight).slice(0, 10); // Fonksiyonun beklediği tip ile uyumluysa bu şekilde bırak
  }
}