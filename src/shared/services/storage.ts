import type { UserRating, UserProfile } from '../types';
import { ProfileService } from '../../features/profile/services/profileService';

interface WatchlistItem {
  id: number;
  content: any;
  addedAt: number;
}

const STORAGE_KEYS = {
  RATINGS: 'cinematch_ratings',
  PROFILE: 'cinematch_profile',
  WATCHLIST: 'cinematch_watchlist',
  SETTINGS: 'cinematch_settings',
  LEARNING_EVENTS: 'cinematch_learning_events',
  ADAPTIVE_CONFIG: 'cinematch_adaptive_config',
  NEURAL_MODEL: 'cinematch_neural_model',
  RECOMMENDATION_FILTERS: 'cinematch_recommendation_filters',
  CURATED_FILTERS: 'cinematch_curated_filters',
  SEARCH_QUERY: 'cinematch_search_query',
  ACTIVE_TAB: 'cinematch_active_tab'
};

export class StorageService {
  static saveRatings(ratings: UserRating[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
    } catch (error) {
      console.error('Error saving ratings:', error);
    }
  }

  static getRatings(): UserRating[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting ratings:', error);
      return [];
    }
  }

  static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  static getProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static saveWatchlist(watchlist: WatchlistItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }

  static getWatchlist(): WatchlistItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  static exportData(): string {
    const data = {
      ratings: this.getRatings(),
      profile: this.getProfile(),
      watchlist: this.getWatchlist(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  static async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.ratings && Array.isArray(data.ratings)) {
        this.saveRatings(data.ratings);
      }
      
      if (data.profile) {
        this.saveProfile(data.profile);
      }

      if (data.watchlist && Array.isArray(data.watchlist)) {
        this.saveWatchlist(data.watchlist);
      }

      // Profil ve neural model otomatik güncellensin
      if (data.ratings && Array.isArray(data.ratings)) {
        try {
          // Profil oluştur ve kaydet
          const profile = await ProfileService.generateProfile(data.ratings);
          if (profile) {
            this.saveProfile(profile);
            // Neural model eğitimi ProfileService.generateProfile içinde zaten tetikleniyor
          }
        } catch (error) {
          console.warn('Profil ve model güncelleme başarısız:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  static clearAllData(): void {
    try {
      // Clear all defined storage keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear any other cinematch-related data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cinematch_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('All Cinematch data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}