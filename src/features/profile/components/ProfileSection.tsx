import React, { useState } from 'react';
import { User, Star, Calendar, Heart, Users, Brain, Film, Award, BarChart3, Zap, Eye, Sparkles } from 'lucide-react';
import type { UserProfile, Genre, UserRating } from '../types';
import { ProfileService } from '../services/profileService';
import { LearningService } from '../../learning/services/learningService';
import { GenreRadarChart } from '../../../shared/components/GenreRadarChart';
import { FavoriteActorsModal } from './FavoriteActorsModal';
import { FavoriteDirectorsModal } from './FavoriteDirectorsModal';
import { FavoriteWritersModal } from './FavoriteWritersModal';
import { NeuralModelInfo } from '../../learning/components/NeuralModelInfo';
import { RealTimeLearningInsights } from '../../learning/components/RealTimeLearningInsights';
import { SkippedContentModal } from './SkippedContentModal';

interface ProfileSectionProps {
  profile: UserProfile;
  genres: Genre[];
  ratings: UserRating[];
  getUserRating: (itemId: number) => number | 'not_watched' | 'not_interested' | 'skip' | null;
  onRateContent: (itemId: number, rating: number | 'not_watched', mediaType?: 'movie' | 'tv') => void;
  isInWatchlist: (itemId: number) => boolean;
  onRemoveFromWatchlist: (itemId: number) => void;
  onEditProfile?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  genres,
  ratings,
  getUserRating,
  onRateContent,
  isInWatchlist,
  onRemoveFromWatchlist,
  onEditProfile
}) => {
  const [showActorsModal, setShowActorsModal] = useState(false);
  const [showDirectorsModal, setShowDirectorsModal] = useState(false);
  const [showWritersModal, setShowWritersModal] = useState(false);
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'people' | 'stats' | 'learning'>('overview');
  
  const profileDescription = ProfileService.generateProfileDescription(profile, genres);
  const learningInsights = LearningService.generateLearningInsights(profile, ratings);
  
  const getTopGenres = () => {
    return Object.entries(profile.genreDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([genreId, percentage]) => {
        const genre = genres.find(g => g.id === parseInt(genreId));
        return { name: genre?.name || 'Bilinmeyen', percentage: percentage.toFixed(1) };
      });
  };

  const getTopPeriods = () => {
    return Object.entries(profile.periodPreference)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([decade, percentage]) => ({ decade, percentage: percentage.toFixed(1) }));
  };

  const getTopActors = () => {
    return Object.values(profile.favoriteActors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getTopDirectors = () => {
    return Object.values(profile.favoriteDirectors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Mock senarist verisi (gerçek uygulamada profile'dan gelecek)
  const getTopWriters = () => {
    // Bu veriler normalde profile'dan gelecek, şimdilik mock data
    return [
      { name: 'Christopher Nolan', count: 4.8 },
      { name: 'Quentin Tarantino', count: 4.7 },
      { name: 'Charlie Kaufman', count: 4.6 },
      { name: 'Aaron Sorkin', count: 4.5 },
      { name: 'Coen Brothers', count: 4.4 },
      { name: 'Paul Thomas Anderson', count: 4.3 },
      { name: 'Woody Allen', count: 4.2 },
      { name: 'David Lynch', count: 4.1 },
      { name: 'Terrence Malick', count: 4.0 },
      { name: 'Spike Jonze', count: 3.9 }
    ];
  };

  const getDetailedStats = () => {
    const validRatings = ratings.filter(r => r.rating !== 'not_watched');
    const movieRatings = validRatings.filter(r => r.mediaType === 'movie' || !r.mediaType);
    const tvRatings = validRatings.filter(r => r.mediaType === 'tv');
    
    // 1-10 puanlama sistemi için dağılım
    const ratingDistribution = {
      10: validRatings.filter(r => r.rating === 10).length,
      9: validRatings.filter(r => r.rating === 9).length,
      8: validRatings.filter(r => r.rating === 8).length,
      7: validRatings.filter(r => r.rating === 7).length,
      6: validRatings.filter(r => r.rating === 6).length,
      5: validRatings.filter(r => r.rating === 5).length,
      4: validRatings.filter(r => r.rating === 4).length,
      3: validRatings.filter(r => r.rating === 3).length,
      2: validRatings.filter(r => r.rating === 2).length,
      1: validRatings.filter(r => r.rating === 1).length,
    };

    const averageMovieRating = movieRatings.length > 0 
      ? movieRatings.reduce((sum, r) => sum + (r.rating as number), 0) / movieRatings.length 
      : 0;
    
    const averageTVRating = tvRatings.length > 0 
      ? tvRatings.reduce((sum, r) => sum + (r.rating as number), 0) / tvRatings.length 
      : 0;

    // NaN kontrolü
    const safeAverageMovieRating = isNaN(averageMovieRating) ? 0 : averageMovieRating;
    const safeAverageTVRating = isNaN(averageTVRating) ? 0 : averageTVRating;

    return {
      totalRatings: validRatings.length,
      movieCount: movieRatings.length,
      tvCount: tvRatings.length,
      averageMovieRating: safeAverageMovieRating,
      averageTVRating: safeAverageTVRating,
      ratingDistribution,
      genreCount: Object.keys(profile.genreDistribution).length,
      favoriteActorCount: Object.keys(profile.favoriteActors).length,
      favoriteDirectorCount: Object.keys(profile.favoriteDirectors).length
    };
  };



  const getPhaseDisplayName = (phase: string) => {
    switch (phase) {
      case 'initial': return 'Başlangıç Profili';
      case 'profiling': return 'Profil Geliştirme Aşaması';
      case 'testing': return 'Test ve Doğrulama Aşaması';
      case 'optimizing': return 'Sürekli Optimizasyon';
      default: return 'Film Profilin';
    }
  };

  const stats = getDetailedStats();

  return (
    <>
      <div className="bg-slate-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-end mb-6 gap-2">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg"
            >
              <User className="h-4 w-4" />
              <span>Profili Düzenle</span>
            </button>
          )}
          <button
            onClick={() => setShowSkippedModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg"
          >
            <Eye className="h-4 w-4" />
            <span>Atlananlar</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: Eye },
            { id: 'people', label: 'Kişiler', icon: Users },
            { id: 'stats', label: 'İstatistikler', icon: BarChart3 },
            { id: 'learning', label: 'Gerçek Zamanlı Öğrenme', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Profile Description */}
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                {profileDescription}
              </p>
            </div>

            {/* Learning Insights */}
            {learningInsights.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-white text-sm">Öğrenme İçgörüleri</h3>
                </div>
                <div className="space-y-2">
                  {learningInsights.map((insight, index) => (
                    <p key={index} className="text-amber-200 text-xs">
                      • {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Radar Chart and Top Genres */}
            <div className="grid lg:grid-cols-2 gap-6">
              <GenreRadarChart profile={profile} genres={genres} />
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="h-4 w-4 text-red-400" />
                  <h3 className="font-semibold text-white text-sm">Tür Tercihlerin</h3>
                </div>
                <div className="space-y-3">
                  {getTopGenres().map((genre, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-500 text-white' :
                          index === 1 ? 'bg-slate-500 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-slate-600 text-slate-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-slate-300 text-sm">{genre.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(genre.percentage))}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-400 text-xs w-10 text-right">%{genre.percentage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Favorite Actors */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-400" />
                  <h3 className="font-semibold text-white text-sm">Favori Oyuncular</h3>
                </div>
                {getTopActors().length > 0 && (
                  <button
                    onClick={() => setShowActorsModal(true)}
                    className="text-green-400 hover:text-green-300 text-xs flex items-center space-x-1"
                  >
                    <Film className="h-3 w-3" />
                    <span>İçerikleri Gör</span>
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getTopActors().map((actor, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-slate-300 text-xs">{actor.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <span className="text-amber-400 text-xs font-medium">{actor.count.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Directors */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Film className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">Favori Yönetmenler</h3>
                </div>
                {getTopDirectors().length > 0 && (
                  <button
                    onClick={() => setShowDirectorsModal(true)}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
                  >
                    <Film className="h-3 w-3" />
                    <span>İçerikleri Gör</span>
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getTopDirectors().map((director, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-slate-300 text-xs">{director.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <span className="text-amber-400 text-xs font-medium">{director.count.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Writers */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-white text-sm">Favori Senaristler</h3>
                </div>
                <button
                  onClick={() => setShowWritersModal(true)}
                  className="text-purple-400 hover:text-purple-300 text-xs flex items-center space-x-1"
                >
                  <Film className="h-3 w-3" />
                  <span>İçerikleri Gör</span>
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getTopWriters().map((writer, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-purple-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-slate-300 text-xs">{writer.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <span className="text-amber-400 text-xs font-medium">{writer.count.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalRatings}</div>
                <div className="text-blue-300 text-sm">Toplam Puanlama</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.movieCount}</div>
                <div className="text-green-300 text-sm">Film</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.tvCount}</div>
                <div className="text-purple-300 text-sm">Dizi</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{profile.averageScore.toFixed(1)}</div>
                <div className="text-amber-300 text-sm">Ortalama Puan</div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-white text-sm">Puan Dağılımı</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-slate-300 text-sm">{rating}</span>
                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-slate-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            rating === '10' || rating === '9' ? 'bg-green-500' :
                            rating === '8' || rating === '7' ? 'bg-blue-500' :
                            rating === '6' || rating === '5' ? 'bg-amber-500' :
                            rating === '4' || rating === '3' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-slate-400 text-sm w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Type Comparison */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-white text-sm">İçerik Türü Analizi</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Film Ortalaması</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${
                              star <= stats.averageMovieRating ? 'text-amber-400 fill-current' : 'text-slate-500'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-amber-400 text-sm font-medium">
                        {stats.averageMovieRating > 0 ? `${stats.averageMovieRating.toFixed(1)}/10` : 'Henüz puanlanmamış'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Dizi Ortalaması</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${
                              star <= stats.averageTVRating ? 'text-amber-400 fill-current' : 'text-slate-500'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-amber-400 text-sm font-medium">
                        {stats.averageTVRating > 0 ? `${stats.averageTVRating.toFixed(1)}/10` : 'Henüz puanlanmamış'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-600">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Film/Dizi Oranı</span>
                      <span>{stats.movieCount}:{stats.tvCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Preferences */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">Dönem Tercihleri</h3>
                </div>
                <div className="space-y-2">
                  {getTopPeriods().map((period, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">{period.decade}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(period.percentage))}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-400 text-xs w-10 text-right">%{period.percentage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Metrics */}
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-white text-sm">Profil Metrikleri</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Keşfedilen Türler</span>
                    <span className="text-amber-400 text-sm font-medium">{stats.genreCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Favori Oyuncular</span>
                    <span className="text-green-400 text-sm font-medium">{stats.favoriteActorCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Favori Yönetmenler</span>
                    <span className="text-blue-400 text-sm font-medium">{stats.favoriteDirectorCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Öğrenme Aşaması</span>
                    <span className="text-purple-400 text-sm font-medium">{getPhaseDisplayName(profile.learningPhase)}</span>
                  </div>
                  {profile.accuracyScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">AI Doğruluk Oranı</span>
                      <span className="text-green-400 text-sm font-medium">%{profile.accuracyScore.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Son Güncelleme</span>
                    <span className="text-slate-400 text-sm">{new Date(profile.lastUpdated).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Network Model Info */}
            <div className="mt-8">
              <NeuralModelInfo 
                profile={profile}
                ratings={ratings}
              />
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div>
            <RealTimeLearningInsights
              profile={profile}
              recentRatings={ratings}
              isVisible={true}
              onClose={() => setActiveTab('overview')}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <FavoriteActorsModal
        isOpen={showActorsModal}
        onClose={() => setShowActorsModal(false)}
        profile={profile}
        genres={genres}
        getUserRating={getUserRating}
        onRateContent={onRateContent}
        isInWatchlist={isInWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
      />

      <FavoriteDirectorsModal
        isOpen={showDirectorsModal}
        onClose={() => setShowDirectorsModal(false)}
        profile={profile}
        genres={genres}
        getUserRating={getUserRating}
        onRateContent={onRateContent}
        isInWatchlist={isInWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
      />

      <FavoriteWritersModal
        isOpen={showWritersModal}
        onClose={() => setShowWritersModal(false)}
        profile={profile}
        genres={genres}
        getUserRating={getUserRating}
        onRateContent={onRateContent}
        isInWatchlist={isInWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
      />

      <SkippedContentModal
        isOpen={showSkippedModal}
        onClose={() => setShowSkippedModal(false)}
        genres={genres}
        onRate={(itemId, rating, mediaType) => onRateContent(itemId, rating, mediaType)}
      />


    </>
  );
};