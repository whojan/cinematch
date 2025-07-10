import React, { useState } from 'react';
import { Bookmark, Star, Tv, Filter, Trash2, Film } from 'lucide-react';
import { ContentFiltersComponent, type ContentFilters } from '../../recommendation/components/ContentFilters';
import type { Movie, TVShow, Genre } from '../types';

interface WatchlistItem {
  id: number;
  content: Movie | TVShow;
  addedAt: number;
}

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onRemoveFromWatchlist: (itemId: number) => void;
  onRateContent: (itemId: number, rating: number | 'not_watched', mediaType?: 'movie' | 'tv') => void;
  getUserRating: (itemId: number) => number | 'not_watched' | 'not_interested' | 'skip' | null;
  genres: Genre[];
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose: _onClose,
  watchlist,
  onRemoveFromWatchlist,
  onRateContent,
  getUserRating,
  genres
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showRatingSelector, setShowRatingSelector] = useState<number | null>(null);
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

  // Filter watchlist items
  const getFilteredWatchlist = (): WatchlistItem[] => {
    let filtered = [...watchlist];

    // Media type filter
    if (filters.mediaType !== 'all') {
      filtered = filtered.filter(item => {
        if (filters.mediaType === 'movie') {
          return item.content.media_type === 'movie' || 'title' in item.content;
        } else {
          return item.content.media_type === 'tv' || 'name' in item.content;
        }
      });
    }

    // Rating filter
    filtered = filtered.filter(item => {
      if (!item?.content) return false;
      const rating = item.content.vote_average || 0;
      return rating >= filters.minRating && rating <= filters.maxRating;
    });

    // Year filter
    filtered = filtered.filter(item => {
      if (!item?.content) return false;
      let year: number;
      if ('release_date' in item.content && item.content.release_date) {
        year = new Date(item.content.release_date).getFullYear();
      } else if ('first_air_date' in item.content && item.content.first_air_date) {
        year = new Date(item.content.first_air_date).getFullYear();
      } else {
        return true;
      }
      
      return year >= filters.minYear && year <= filters.maxYear;
    });

    // Vote count filter
    filtered = filtered.filter(item => {
      if (!item?.content) return false;
      const voteCount = item.content.vote_count || 0;
      return voteCount >= filters.minVoteCount;
    });

    // Genre filter
    if (filters.genres.length > 0) {
      filtered = filtered.filter(item => {
        if (!item?.content) return false;
        const contentGenres = item.content.genre_ids || [];
        return filters.genres.some(genreId => contentGenres.includes(genreId));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (!a?.content || !b?.content) return 0;
      let valueA: any, valueB: any;
      
      switch (filters.sortBy) {
        case 'rating':
          valueA = a.content.vote_average || 0;
          valueB = b.content.vote_average || 0;
          break;
        case 'year':
          const yearA = 'release_date' in a.content ? 
            new Date(a.content.release_date || '').getFullYear() : 
            new Date((a.content as TVShow).first_air_date || '').getFullYear();
          const yearB = 'release_date' in b.content ? 
            new Date(b.content.release_date || '').getFullYear() : 
            new Date((b.content as TVShow).first_air_date || '').getFullYear();
          valueA = yearA;
          valueB = yearB;
          break;
        case 'title':
          valueA = 'title' in a.content ? a.content.title : (a.content as TVShow).name;
          valueB = 'title' in b.content ? b.content.title : (b.content as TVShow).name;
          return filters.sortOrder === 'asc' 
            ? valueA.localeCompare(valueB, 'tr')
            : valueB.localeCompare(valueA, 'tr');
        case 'popularity':
          valueA = a.content.vote_count || 0;
          valueB = b.content.vote_count || 0;
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

  const filteredWatchlist = getFilteredWatchlist();

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



  if (!isOpen) return null;

  return (
    <div className="space-y-6 overflow-x-hidden w-full px-2 sm:px-4 lg:px-8">
      {/* Content */}
      <div className="space-y-6">
        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 max-w-md mx-auto border border-slate-700/50">
              <Bookmark className="h-16 w-16 text-slate-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">
                İzleme Listen Boş
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Henüz izleme listene içerik eklemedin. Keşif İçerikleri sekmesinden beğendiğin film ve dizileri listene ekleyebilirsin.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-300" />
                  <h3 className="font-semibold text-white text-sm">Filtreler</h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  {showFilters ? 'Gizle' : 'Göster'}
                </button>
              </div>
              
              {showFilters && (
                <ContentFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  genres={genres}
                  isOpen={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                  totalCount={watchlist.length}
                  filteredCount={filteredWatchlist.length}
                />
              )}
            </div>

            {/* Watchlist Items */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 overflow-x-hidden w-full lg:px-0">
              {filteredWatchlist.map((item) => {
                const content = item.content;
                const title = getTitle(content);
                const year = getYear(content);
                const genreNames = getGenreNames(content.genre_ids || []);
                const rating = content.vote_average || 0;
                const voteCount = content.vote_count || 0;
                const posterPath = content.poster_path;
                const isMovie = 'title' in content;
                const userRating = getUserRating(content.id);

                return (
                  <div key={item.id} className="bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 transition-all duration-300 hover:scale-105 w-full">
                    {/* Poster */}
                    <div className="relative aspect-[2/2.7]">
                      <img
                        src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder-poster.jpg'}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-poster.jpg';
                        }}
                      />
                      
                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isMovie 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-purple-500 text-white'
                        }`}>
                          {isMovie ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                        </div>
                      </div>

                      {/* Rating Badge */}
                      {rating > 0 && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ⭐ {rating.toFixed(1)}
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFromWatchlist(content.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Listeden kaldır"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Content Info */}
                    <div className="p-1">
                      <h3 className="font-semibold text-white text-[10px] mb-1 line-clamp-2">
                        {title}
                      </h3>
                      
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-1">
                        <span>{year}</span>
                        {genreNames && (
                          <>
                            <span>•</span>
                            <span className="line-clamp-1">{genreNames}</span>
                          </>
                        )}
                      </div>

                      {/* Rating */}
                      {rating > 0 && (
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-amber-400 fill-current" />
                            <span className="text-amber-400 text-[10px] font-medium">{rating.toFixed(1)}</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">
                            {voteCount.toLocaleString()} oy
                          </span>
                        </div>
                      )}

                      {/* User Rating */}
                      {userRating && typeof userRating === 'number' ? (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-green-400 text-[10px] font-medium">Senin Puanın:</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-3 w-3 ${
                                  star <= userRating ? 'text-green-400 fill-current' : 'text-slate-500'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-green-400 text-[10px] font-medium">{userRating}/10</span>
                        </div>
                      ) : (
                        <div className="mb-1">
                          <button
                            onClick={() => setShowRatingSelector(showRatingSelector === content.id ? null : content.id)}
                            className="w-full bg-slate-600 hover:bg-slate-500 text-white text-[10px] py-1 rounded transition-colors"
                          >
                            Puanla
                          </button>
                        </div>
                      )}

                      {/* Rating Selector */}
                      {showRatingSelector === content.id && (
                        <div className="mb-1 p-2 bg-slate-600 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-[10px]">Puanını ver:</span>
                            <button
                              onClick={() => setShowRatingSelector(null)}
                              className="text-slate-400 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => {
                                  onRateContent(content.id, rating, isMovie ? 'movie' : 'tv');
                                  setShowRatingSelector(null);
                                }}
                                className="bg-slate-500 hover:bg-amber-500 text-white text-[10px] py-1 rounded transition-colors"
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};