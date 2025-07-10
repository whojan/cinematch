import React, { useState, useEffect } from 'react';
import { Star, Calendar, Play, Tv, Filter, Award } from 'lucide-react';
import { tmdbService } from '../../content/services/tmdb';
import { ContentFiltersComponent, type ContentFilters } from '../../recommendation/components/ContentFilters';
import type { Movie, TVShow, Genre, UserRating } from '../types';

interface RatedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratings: UserRating[];
  genres: Genre[];
}

export const RatedContentModal: React.FC<RatedContentModalProps> = ({
  isOpen,
  onClose: _onClose,
  ratings,
  genres
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [contentDetails, setContentDetails] = useState<Map<number, Movie | TVShow>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  
  const [filters, setFilters] = useState<ContentFilters>({
    mediaType: 'all',
    minRating: 0,
    maxRating: 10,
    minYear: 1900,
    maxYear: new Date().getFullYear(),
    genres: [],
    sortBy: 'rating',
    sortOrder: 'desc',
    minVoteCount: 0
  });

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(ratings.filter(r => r.rating !== 'not_watched').length / PAGE_SIZE);
  useEffect(() => { setCurrentPage(1); }, [filters, ratings.length]);

  // Load content details for ratings
  const loadContentDetails = async (movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    if (contentDetails.has(movieId) || loadingDetails.has(movieId)) return;

    setLoadingDetails(prev => new Set(prev).add(movieId));
    
    try {
      let content;
      if (mediaType === 'tv') {
        content = await tmdbService.getTVShowDetails(movieId);
      } else {
        content = await tmdbService.getMovieDetails(movieId);
      }
      
      if (content) {
        setContentDetails(prev => new Map(prev).set(movieId, content));
      }
    } catch (error) {
      console.error(`Error loading content details for ${movieId}:`, error);
      // Don't show error to user, just skip this content
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
    }
  };

  // Load content details for visible ratings
  useEffect(() => {
    const validRatings = ratings.filter(r => r.rating !== 'not_watched');
    validRatings.forEach(rating => {
      loadContentDetails(rating.movieId, rating.mediaType);
    });
  }, [ratings]);

  // Filter rated content
  const getFilteredRatings = (): UserRating[] => {
    // Sadece gerçek puanlananlar ve 'not_interested' olanlar
    let filtered = ratings.filter(r => r.rating !== 'not_watched' && r.rating !== 'skip');

    // Apply filters based on content details
    filtered = filtered.filter(rating => {
      const content = contentDetails.get(rating.movieId);
      if (!content) return true; // Show while loading

      // Media type filter
      if (filters.mediaType !== 'all') {
        if (filters.mediaType === 'movie') {
          if (content.media_type === 'tv' || 'name' in content) return false;
        } else {
          if (content.media_type === 'movie' || 'title' in content) return false;
        }
      }

      // Rating filter (TMDB rating)
      const tmdbRating = content.vote_average || 0;
      if (tmdbRating < filters.minRating || tmdbRating > filters.maxRating) return false;

      // Year filter
      let year: number;
      if ('release_date' in content && content.release_date) {
        year = new Date(content.release_date).getFullYear();
      } else if ('first_air_date' in content && content.first_air_date) {
        year = new Date(content.first_air_date).getFullYear();
      } else {
        return true;
      }
      
      if (year < filters.minYear || year > filters.maxYear) return false;

      // Vote count filter
      const voteCount = content.vote_count || 0;
      if (voteCount < filters.minVoteCount) return false;

      // Genre filter
      if (filters.genres.length > 0) {
        const contentGenres = content.genre_ids || [];
        if (!filters.genres.some(genreId => contentGenres.includes(genreId))) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const contentA = contentDetails.get(a.movieId);
      const contentB = contentDetails.get(b.movieId);
      
      let valueA: any, valueB: any;
      
      switch (filters.sortBy) {
        case 'rating':
          // Sort by user rating first, then TMDB rating
          valueA = (a.rating as number) * 10 + (contentA?.vote_average || 0);
          valueB = (b.rating as number) * 10 + (contentB?.vote_average || 0);
          break;
        case 'year':
          const yearA = contentA && 'release_date' in contentA ? 
            new Date(contentA.release_date || '').getFullYear() : 
            contentA && 'first_air_date' in contentA ? new Date(contentA.first_air_date || '').getFullYear() : 0;
          const yearB = contentB && 'release_date' in contentB ? 
            new Date(contentB.release_date || '').getFullYear() : 
            contentB && 'first_air_date' in contentB ? new Date(contentB.first_air_date || '').getFullYear() : 0;
          valueA = yearA;
          valueB = yearB;
          break;
        case 'title':
          const titleA = contentA && 'title' in contentA ? contentA.title : contentA && 'name' in contentA ? contentA.name : '';
          const titleB = contentB && 'title' in contentB ? contentB.title : contentB && 'name' in contentB ? contentB.name : '';
          return filters.sortOrder === 'asc' 
            ? titleA.localeCompare(titleB, 'tr')
            : titleB.localeCompare(titleA, 'tr');
        case 'popularity':
          valueA = contentA?.vote_count || 0;
          valueB = contentB?.vote_count || 0;
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });

    return filtered;
  };

  const filteredRatings = getFilteredRatings();

  const getTitle = (content: Movie | TVShow): string => {
    return 'title' in content ? content.title : content.name;
  };

  const getYear = (content: Movie | TVShow): string => {
    const date = 'release_date' in content ? content.release_date : content.first_air_date;
    return date ? new Date(date).getFullYear().toString() : 'Bilinmiyor';
  };

  const getGenreNames = (genreIds: number[]): string => {
    if (!genreIds || genreIds.length === 0) return '';
    
    return genreIds
      .map(id => genres.find(g => g.id === id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ') || '';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 9) return 'text-green-400';
    if (rating >= 7) return 'text-amber-400';
    if (rating >= 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRatingText = (rating: number): string => {
    if (rating >= 9) return 'Mükemmel';
    if (rating >= 8) return 'Çok İyi';
    if (rating >= 7) return 'İyi';
    if (rating >= 6) return 'Fena Değil';
    if (rating >= 5) return 'Orta';
    if (rating >= 4) return 'Zayıf';
    if (rating >= 3) return 'Kötü';
    return 'Çok Kötü';
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6 overflow-x-hidden w-full px-2 sm:px-4 lg:px-8">
      {ratings.filter(r => r.rating !== 'not_watched').length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Henüz hiç içerik puanlamadınız
          </h3>
          <p className="text-slate-400">
            Film ve dizileri 1-10 arası puanlayarak zevkinizi öğrenmeme yardımcı olun.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6">
            <ContentFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              genres={genres}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              totalCount={ratings.filter(r => r.rating !== 'not_watched').length}
              filteredCount={filteredRatings.length}
            />
          </div>

          {/* Ratings Grid */}
          {filteredRatings.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                Filtrelere uygun içerik bulunamadı
              </p>
              <p className="text-slate-500 text-sm">
                Filtreleri değiştirerek daha fazla içerik görebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 overflow-x-hidden w-full lg:px-0">
                {filteredRatings.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE).map((rating) => {
                  const content = contentDetails.get(rating.movieId);
                  const isLoading = loadingDetails.has(rating.movieId);
                  
                  return (
                    <div key={rating.movieId} className="bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 transition-all duration-300 hover:scale-105 w-full">
                      <div className="aspect-[2/2.7] relative">
                        {content ? (
                          <img
                            src={tmdbService.getImageUrl(content.poster_path, 'w342')}
                            alt={getTitle(content)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/374151/f8fafc?text=Poster+Yok';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                            {isLoading ? (
                              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <span className="text-slate-400">Yükleniyor...</span>
                            )}
                          </div>
                        )}
                        
                        {content && (
                          <>
                            {/* TMDB Rating Badge */}
                            <div className="absolute top-1 right-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                              <div className="flex items-center space-x-0.5 text-yellow-400">
                                <Star className="h-2 w-2 fill-current" />
                                <span className="text-xs font-medium">
                                  {content.vote_average ? content.vote_average.toFixed(1) : 'N/A'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Media Type Badge */}
                            <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                              <div className="flex items-center space-x-0.5">
                                {content.media_type === 'tv' || 'name' in content ? (
                                  <Tv className="h-2 w-2 text-blue-400" />
                                ) : (
                                  <Play className="h-2 w-2 text-green-400" />
                                )}
                                <span className="text-xs font-medium text-white">
                                  {content.media_type === 'tv' || 'name' in content ? 'Dizi' : 'Film'}
                                </span>
                              </div>
                            </div>

                            {/* User Rating Badge */}
                            {rating.rating !== 'skip' ? (
                              <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                                <div className="flex items-center space-x-0.5">
                                  <Star className={`h-2 w-2 fill-current ${getRatingColor(rating.rating as number)}`} />
                                  <span className={`text-xs font-medium ${getRatingColor(rating.rating as number)}`}>{rating.rating}/10</span>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                                <span className="text-xs font-medium text-orange-400">Atlandı</span>
                              </div>
                            )}

                            {/* Year Badge */}
                            <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                              <div className="flex items-center space-x-0.5">
                                <Calendar className="h-2 w-2 text-slate-300" />
                                <span className="text-xs text-white">{getYear(content)}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="p-1">
                        <h4 className="font-medium text-white text-[10px] mb-1 line-clamp-2 leading-tight">
                          {content ? getTitle(content) : `İçerik #${rating.movieId}`}
                        </h4>
                        
                        {content && content.genre_ids && content.genre_ids.length > 0 && (
                          <p className="text-slate-300 text-[10px] mb-1">
                            {getGenreNames(content.genre_ids)}
                          </p>
                        )}
                        
                        {content && content.overview && (
                          <p className="text-slate-400 text-[10px] line-clamp-1 mb-2">
                            {content.overview}
                          </p>
                        )}

                        {/* Rating Display */}
                        {rating.rating !== 'skip' ? (
                          <div className="bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded p-1 border border-slate-500/50 mb-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-[10px] font-medium">Puanın:</span>
                              <div className="flex items-center space-x-1">
                                <span className={`text-xs font-bold ${getRatingColor(rating.rating as number)}`}>{rating.rating}/10</span>
                                <span className="text-slate-400 text-[10px]">({getRatingText(rating.rating as number)})</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-slate-600/50 to-slate-500/50 rounded p-1 border border-slate-500/50 mb-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-[10px] font-medium">Durum:</span>
                              <span className="text-orange-400 text-xs font-bold">Atlandı (İzlemedim)</span>
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500">
                          {new Date(rating.timestamp).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40 text-xs"
                  >İlk Sayfa</button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40 text-xs"
                  >Önceki</button>
                  <span className="text-slate-400 text-xs mx-2">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40 text-xs"
                  >Sonraki</button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40 text-xs"
                  >Son Sayfa</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};