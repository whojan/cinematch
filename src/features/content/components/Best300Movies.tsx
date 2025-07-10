import React, { useState, useEffect, useCallback, useMemo } from 'react';
// @ts-expect-error: JSON importu için
import best300List from '/src/features/content/data/rtn300.json';
import { RecommendationCard } from '../../recommendation/components/RecommendationCard';
import { StorageService } from '../../../shared/services/storage';
import { tmdbService } from '../services/tmdb';
import type { Genre, UserRating } from '../types';

const PAGE_SIZE = 25;

export const Best300Movies: React.FC = () => {
  const [page, setPage] = useState(1);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [posterMap, setPosterMap] = useState<{ [id: number]: string | null }>({});
  const [movieDetailsMap, setMovieDetailsMap] = useState<{ [id: number]: any }>({});
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [hideRated, setHideRated] = useState(false);
  const [hideWatchlisted, setHideWatchlisted] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    setUserRatings(StorageService.getRatings());
    setWatchlist(StorageService.getWatchlist().map(w => w.id));
  }, []);

  const getUserRating = useCallback((tmdbId: number): UserRating['rating'] | null => {
    const rating = userRatings.find(r => r.movieId === tmdbId);
    return rating ? rating.rating : null;
  }, [userRatings]);

  const isInWatchlist = useCallback((tmdbId: number) => watchlist.includes(tmdbId), [watchlist]);

  const handleRate = useCallback((tmdbId: number, rating: number | 'not_watched' | 'not_interested' | 'skip') => {
    const prev = StorageService.getRatings();
    const existing = prev.find(r => r.movieId === tmdbId);
    let newRatings;
    if (existing) {
      newRatings = prev.map(r => r.movieId === tmdbId ? { ...r, rating } : r);
    } else {
      newRatings = [...prev, { movieId: tmdbId, rating, timestamp: Date.now() }];
    }
    StorageService.saveRatings(newRatings);
    setUserRatings(newRatings);
  }, []);

  const handleAddToWatchlist = useCallback((tmdbId: number, details: any) => {
    const prev = StorageService.getWatchlist();
    if (!prev.find(w => w.id === tmdbId)) {
      const newList = [...prev, { id: tmdbId, content: details, addedAt: Date.now() }];
      StorageService.saveWatchlist(newList);
      setWatchlist(newList.map(w => w.id));
    }
  }, []);
  const handleRemoveFromWatchlist = useCallback((tmdbId: number) => {
    const prev = StorageService.getWatchlist();
    const newList = prev.filter(w => w.id !== tmdbId);
    StorageService.saveWatchlist(newList);
    setWatchlist(newList.map(w => w.id));
  }, []);

  // Sadece TMDB ID'si olan filmlerle çalış
  const filteredList = useMemo(() => {
    return (best300List as any[]).filter(film => film.tmdb_id);
  }, []);

  // Filtreler
  const filteredFilms = useMemo(() => {
    return filteredList.filter((film: any) => {
      const details = movieDetailsMap[film.tmdb_id];
      if (selectedGenres.length > 0) {
        let filmGenres: number[] = details?.genre_ids || [];
        if ((!filmGenres || filmGenres.length === 0) && Array.isArray(details?.genres)) {
          filmGenres = details.genres.map((g: any) => g.id).filter(Boolean);
        }
        if (!filmGenres.some(g => selectedGenres.includes(g))) return false;
      }
      const userRating = getUserRating(film.tmdb_id);
      if (hideRated && (typeof userRating === 'number' || userRating === 'not_interested' || userRating === 'skip')) return false;
      if (hideWatchlisted && isInWatchlist(film.tmdb_id)) return false;
      return true;
    });
  }, [filteredList, movieDetailsMap, selectedGenres, hideRated, hideWatchlisted, getUserRating, isInWatchlist]);

  const totalPages = Math.ceil(filteredFilms.length / PAGE_SIZE);
  const pagedFilms = useMemo(() => {
    return filteredFilms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredFilms, page]);

  // Poster ve detayları yükle
  useEffect(() => {
    let cancelled = false;
    const fetchAllDetails = async () => {
      setLoading(true);
      const newPosterMap: { [id: number]: string | null } = {};
      const newDetailsMap: { [id: number]: any } = {};
      const missingFilms = filteredList.filter((film: any) => film.tmdb_id && !movieDetailsMap[film.tmdb_id]);
      for (let i = 0; i < missingFilms.length; i += 10) {
        const group = missingFilms.slice(i, i + 10);
        await Promise.all(
          group.map(async (film: any) => {
            if (film.tmdb_id) {
              try {
                const data = await tmdbService.getMovieDetails(film.tmdb_id);
                newPosterMap[film.tmdb_id] = data.poster_path ? tmdbService.getImageUrl(data.poster_path, 'w342') : null;
                newDetailsMap[film.tmdb_id] = data;
              } catch {
                newPosterMap[film.tmdb_id] = null;
                newDetailsMap[film.tmdb_id] = null;
              }
            }
          })
        );
        if (Object.keys(newDetailsMap).length > 0 && !cancelled) {
          setPosterMap(prev => ({ ...prev, ...newPosterMap }));
          setMovieDetailsMap(prev => ({ ...prev, ...newDetailsMap }));
        }
      }
      if (!cancelled) setLoading(false);
    };
    fetchAllDetails();
    return () => { cancelled = true; };
  }, [filteredList, movieDetailsMap]);

  // Türleri çek
  useEffect(() => {
    const allGenreIds = new Set<number>();
    filteredList.forEach((film: any) => {
      const details = movieDetailsMap[film.tmdb_id];
      let filmGenres: number[] = details?.genre_ids || [];
      if ((!filmGenres || filmGenres.length === 0) && Array.isArray(details?.genres)) {
        filmGenres = details.genres.map((g: any) => g.id).filter(Boolean);
      }
      filmGenres.forEach(id => allGenreIds.add(id));
    });
    tmdbService.fetchGenres().then(allGenres => {
      setGenres(allGenres.filter(g => allGenreIds.has(g.id)));
    });
  }, [movieDetailsMap, filteredList]);

  // RecommendationCard için gerçekçi Recommendation objesi oluştur
  const toRecommendation = useCallback((film: any, poster: string | null, details: any): any => {
    let genre_ids = details?.genre_ids;
    if ((!genre_ids || genre_ids.length === 0) && Array.isArray(details?.genres)) {
      genre_ids = details.genres.map((g: any) => g.id).filter(Boolean);
    }
    // Türkçe hikaye önceliği: overview_tr varsa onu, yoksa overview Türkçe ise onu, yoksa film.synopsis varsa onu, yoksa ''
    let overview = '';
    if (details?.overview_tr) {
      overview = details.overview_tr;
    } else if (details?.overview && (details?.original_language === 'tr' || /^[a-zA-ZçÇğĞıİöÖşŞüÜ ]{10,}$/.test(details.overview) === false)) {
      overview = details.overview;
    } else if (film.synopsis) {
      overview = film.synopsis;
    } else {
      overview = '';
    }
    return {
      movie: {
        id: film.tmdb_id,
        title: details?.title || film.ad,
        poster_path: poster,
        overview,
        genre_ids: genre_ids || [],
        vote_average: details?.vote_average || 0,
        vote_count: details?.vote_count || 0,
        release_date: details?.release_date || '',
        media_type: 'movie',
        original_language: details?.original_language || '',
        backdrop_path: details?.backdrop_path || null,
      },
      matchScore: 0,
      reasons: [],
      confidence: 1,
      novelty: 0,
      diversity: 0,
      explanation: { primaryFactors: [], secondaryFactors: [], riskFactors: [] },
      recommendationType: 'safe',
    };
  }, []);

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]);
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [hideRated, hideWatchlisted]);

  // RTN300 güncelleme fonksiyonu
  const handleUpdateRtn300List = async () => {
    setUpdating(true);
    setUpdateMsg(null);
    setProgress(0);
    try {
      const res = await fetch('http://localhost:4000/api/update-rtn300-list', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setUpdateMsg('Güncelleme sırasında hata oluştu.');
        setUpdating(false);
        return;
      }
      // SSE ile ilerlemeyi dinle
      const eventSource = new window.EventSource(`http://localhost:4000/api/rtn300-progress/${data.eventId}`);
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.progress) setProgress(Number(msg.progress));
          if (msg.done) {
            setUpdateMsg('300 listesi başarıyla güncellendi!');
            setUpdating(false);
            setProgress(100);
            eventSource.close();
          }
          if (msg.error) {
            setUpdateMsg('Güncelleme sırasında hata oluştu: ' + msg.error);
            setUpdating(false);
            eventSource.close();
          }
        } catch {}
      };
    } catch (e) {
      setUpdateMsg('Güncelleme sırasında hata oluştu.');
      setUpdating(false);
    }
  };

  return (
    <div className="px-2 sm:px-4 lg:px-8 w-full">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span role="img" aria-label="Award">🏆</span> Tüm Zamanların En İyi Filmleri
      </h1>
      <div className="mb-4 flex flex-col gap-2 items-start">
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-60"
            onClick={handleUpdateRtn300List}
            disabled={updating}
          >
            {updating ? 'Güncelleniyor...' : 'Listeyi Güncelle'}
          </button>
          {updateMsg && <span className="text-sm text-green-400 ml-2">{updateMsg}</span>}
        </div>
        {updating && (
          <div className="w-full min-w-[200px] bg-gray-200 rounded-full h-2.5">
            <div className="bg-pink-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        {updating && (
          <div className="text-xs text-slate-400 mt-1">İlerleme: %{progress}</div>
        )}
      </div>
      <div className="mb-4 text-slate-300 font-medium">Toplam {filteredList.length} film</div>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <span className="text-white font-medium mr-2">Tür:</span>
        {genres.map(genre => (
          <button
            key={genre.id}
            onClick={() => toggleGenre(genre.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${selectedGenres.includes(genre.id) ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
          >
            {genre.name}
          </button>
        ))}
        {selectedGenres.length > 0 && (
          <span className="ml-2 px-2 py-1 rounded bg-pink-500/20 text-pink-300 text-xs font-semibold">Tür Filtresi Aktif</span>
        )}
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideRated}
            onChange={() => setHideRated(v => !v)}
            className="accent-pink-500"
          />
          <span>Puanlananları Gizle</span>
        </label>
        <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideWatchlisted}
            onChange={() => setHideWatchlisted(v => !v)}
            className="accent-red-500"
          />
          <span>Listeye Eklenenleri Gizle</span>
        </label>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="min-h-[480px] bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pagedFilms.map((film: any) => {
            const details = movieDetailsMap[film.tmdb_id];
            const poster = posterMap[film.tmdb_id] || null;
            if (!details) {
              return <div key={film.tmdb_id} className="min-h-[480px] bg-slate-800 rounded-2xl animate-pulse" />;
            }
            const recommendation = toRecommendation(film, poster, details);
            return (
              <RecommendationCard
                key={film.tmdb_id}
                recommendation={recommendation}
                genres={genres}
                onRate={rating => handleRate(film.tmdb_id, rating)}
                userRating={getUserRating(film.tmdb_id)}
                isInWatchlist={isInWatchlist(film.tmdb_id)}
                onAddToWatchlist={() => handleAddToWatchlist(film.tmdb_id, details)}
                onRemoveFromWatchlist={() => handleRemoveFromWatchlist(film.tmdb_id)}
                showReasons={false}
                showMatchScore={false}
              />
            );
          })}
        </div>
      )}
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Önceki
        </button>
        <span className="text-slate-300 text-sm font-medium">
          {page} / {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}; 