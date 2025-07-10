import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { tmdbService } from '../../content/services/tmdb';
import type { Movie, TVShow, Genre } from '../types';
import { RecommendationCard } from '../../recommendation/components/RecommendationCard';

interface SkippedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  genres: Genre[];
  onRate: (itemId: number, rating: number, mediaType: 'movie' | 'tv') => void;
}

interface SkippedItem {
  id: number;
  mediaType: 'movie' | 'tv';
  timestamp: number;
}

export const SkippedContentModal: React.FC<SkippedContentModalProps> = ({
  isOpen,
  genres,
  onRate
}) => {
  const [skipped, setSkipped] = useState<SkippedItem[]>([]);
  const [contentDetails, setContentDetails] = useState<Map<number, Movie | TVShow>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(skipped.length / pageSize));

  useEffect(() => {
    if (!isOpen) return;
    // Skipped içerikleri localStorage'dan yükle
    const raw = localStorage.getItem('skippedContent');
    if (raw) {
      try {
        setSkipped(JSON.parse(raw));
      } catch {
        setSkipped([]);
      }
    } else {
      setSkipped([]);
    }
    setPage(1); // Modal açıldığında ilk sayfaya dön
  }, [isOpen]);

  // İçerik detaylarını yükle
  useEffect(() => {
    skipped.forEach(item => {
      if (!contentDetails.has(item.id) && !loadingDetails.has(item.id)) {
        setLoadingDetails(prev => new Set(prev).add(item.id));
        const fetchDetails = async () => {
          try {
            let content;
            if (item.mediaType === 'tv') {
              content = await tmdbService.getTVShowDetails(item.id);
            } else {
              content = await tmdbService.getMovieDetails(item.id);
            }
            if (content) {
              setContentDetails(prev => new Map(prev).set(item.id, content));
            }
          } finally {
            setLoadingDetails(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.id);
              return newSet;
            });
          }
        };
        fetchDetails();
      }
    });
  }, [skipped, contentDetails, loadingDetails]);

  const handleRate = (itemId: number, rating: number, mediaType: 'movie' | 'tv') => {
    // Puan verildiğinde skipped listesinden çıkar
    const updated = skipped.filter(item => item.id !== itemId);
    setSkipped(updated);
    localStorage.setItem('skippedContent', JSON.stringify(updated));
    onRate(itemId, rating, mediaType);
  };

  if (!isOpen) return null;

  // Sayfalama için slice
  const pagedSkipped = skipped.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 overflow-x-hidden w-full px-2 sm:px-4 lg:px-8">
      {skipped.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Hiç atlanan içerik yok
          </h3>
          <p className="text-slate-400">
            Atladığınız içerikler burada listelenecek.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-x-hidden w-full lg:px-0">
          {pagedSkipped.map(item => {
            const content = contentDetails.get(item.id);
            const isLoading = loadingDetails.has(item.id);
            if (!content) {
              return (
                <div key={item.id} className="bg-slate-700 rounded-2xl flex items-center justify-center min-h-[350px]">
                  {isLoading ? (
                    <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <span className="text-slate-400">Yükleniyor...</span>
                  )}
                </div>
              );
            }
            // RecommendationCard benzeri props hazırlama
            const recommendation = {
              movie: content,
              matchScore: 0,
              reasons: [],
              confidence: 0,
              novelty: 0,
              diversity: 0,
              explanation: {
                primaryFactors: ['Atlanan içerik'],
                secondaryFactors: [],
                riskFactors: [],
              },
              recommendationType: 'safe' as const,
            };
            return (
              <RecommendationCard
                key={item.id}
                recommendation={recommendation}
                genres={genres}
                onRate={(rating) => {
                  if (typeof rating === 'number' && rating >= 1 && rating <= 10) {
                    handleRate(item.id, rating, item.mediaType);
                  }
                }}
                userRating={null}
                showReasons={false}
                showMatchScore={false}
              />
            );
          })}
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >İlk</button>
            <button
              className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >Önceki</button>
            <span className="text-slate-300 text-sm mx-2">{page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >Sonraki</button>
            <button
              className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >Son</button>
          </div>
        </>
      )}
    </div>
  );
}; 