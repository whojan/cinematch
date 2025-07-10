import React from 'react';
import { Search, Filter, SortAsc, SortDesc, X, Film, Tv } from 'lucide-react';

interface SearchResultsSummaryProps {
  query: string;
  resultCount: number;
  totalResults: number;
  searchType: 'content' | 'person' | 'mixed';
  onClearSearch: () => void;
  onSortChange?: (sortBy: string) => void;
  onFilterChange?: (filters: any) => void;
  currentSort?: string;
  currentFilters?: any;
}

export const SearchResultsSummary: React.FC<SearchResultsSummaryProps> = ({
  query,
  resultCount,
  totalResults,
  searchType,
  onClearSearch,
  onSortChange,
  onFilterChange,
  currentSort = 'relevance',
  currentFilters = {}
}) => {
  const getSearchTypeText = () => {
    switch (searchType) {
      case 'content':
        return 'İçerik';
      case 'person':
        return 'Kişi';
      case 'mixed':
        return 'Karışık';
      default:
        return 'Sonuç';
    }
  };

  const getSortOptions = () => [
    { value: 'relevance', label: 'Alakalılık', icon: Search },
    { value: 'rating', label: 'Puan', icon: SortDesc },
    { value: 'year', label: 'Yıl', icon: SortDesc },
    { value: 'title', label: 'Başlık', icon: SortAsc },
    { value: 'popularity', label: 'Popülerlik', icon: SortDesc }
  ];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Search className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-amber-300 font-semibold text-sm">
                🔍 Arama Sonuçları
              </h3>
              <span className="text-amber-400 text-xs font-medium px-2 py-1 bg-amber-500/20 rounded-full">
                {getSearchTypeText()}
              </span>
            </div>
            <p className="text-amber-200 text-xs leading-relaxed">
              <span className="font-medium">"{query}"</span> için {resultCount} sonuç bulundu
              {totalResults > resultCount && ` (${totalResults} toplam sonuçtan)`}.
              {resultCount === 0 && ' Farklı bir arama terimi deneyebilir veya arama geçmişinden bir terim seçebilirsin.'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClearSearch}
          className="text-amber-400 hover:text-amber-300 transition-colors p-1"
          title="Aramayı Temizle"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {resultCount > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Sort Options */}
            {onSortChange && (
              <div className="flex items-center space-x-2">
                <SortAsc className="h-4 w-4 text-amber-400" />
                <select
                  value={currentSort}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  {getSortOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-amber-400" />
              <div className="flex items-center space-x-1">
                <button
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentFilters.mediaType === 'movie' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                  onClick={() => onFilterChange?.({ ...currentFilters, mediaType: 'movie' })}
                >
                  <Film className="h-3 w-3 inline mr-1" />
                  Film
                </button>
                <button
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentFilters.mediaType === 'tv' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                  onClick={() => onFilterChange?.({ ...currentFilters, mediaType: 'tv' })}
                >
                  <Tv className="h-3 w-3 inline mr-1" />
                  Dizi
                </button>
                <button
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    currentFilters.mediaType === 'all' || !currentFilters.mediaType
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                  onClick={() => onFilterChange?.({ ...currentFilters, mediaType: 'all' })}
                >
                  Tümü
                </button>
              </div>
            </div>
          </div>

          {/* Result Stats */}
          <div className="text-xs text-amber-300">
            {resultCount} sonuç gösteriliyor
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsSummary; 