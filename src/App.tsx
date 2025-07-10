import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { OnboardingFlow } from './features/onboarding/components/OnboardingFlow';
import { ProfileSection } from './features/profile/components/ProfileSection';
import { MovieRecommendations } from './components/MovieRecommendations';
import { RecommendationFilters } from './components/RecommendationFilters';
import { SearchResultsSummary } from './shared/components/SearchResultsSummary';
import { FeaturedLists } from './features/content/components/FeaturedLists';
import { Sidebar } from './shared/components/Sidebar';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { RealTimeLearningInsights } from './features/learning/components/RealTimeLearningInsights';
import { learningService } from './features/learning/services/learningService';
import { realTimeLearningService } from './features/learning/services/realTimeLearningService';
import { logger } from './shared/utils/logger';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    genres: string[];
    actors: string[];
    directors: string[];
    writers: string[];
  };
  ratings: Array<{
    movieId: string;
    rating: number | 'not_watched';
    timestamp: Date;
  }>;
  watchlist: string[];
  skippedContent: string[];
}

function App() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeView, setActiveView] = useState<'recommendations' | 'profile' | 'search' | 'featured'>('recommendations');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    genres: [] as string[],
    yearRange: [1900, 2024] as [number, number],
    ratingRange: [0, 10] as [number, number],
    contentType: 'all' as 'all' | 'movies' | 'tv'
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any>(null);

  // Move all useEffect hooks before any conditional returns
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        const updatedProfile = e.newValue ? JSON.parse(e.newValue) : null;
        setProfile(updatedProfile);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && profile) {
      const loadAILearningContent = async () => {
        try {
          const insights = await realTimeLearningService.getPersonalizedInsights(profile.id);
          setLearningInsights(insights);
        } catch (error) {
          logger.error('Failed to load AI learning content:', error);
        }
      };

      loadAILearningContent();
    }
  }, [isAuthenticated, profile]);

  useEffect(() => {
    if (isAuthenticated && profile) {
      const shouldShowOnboarding = !profile.preferences.genres.length || 
                                   !profile.ratings.length;
      setShowOnboarding(shouldShowOnboarding);
    }
  }, [isAuthenticated, profile]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (profile && activeView === 'recommendations') {
      loadRecommendations();
    }
  }, [profile, activeView, filters]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadUserProfile = async () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else if (user) {
        const newProfile: UserProfile = {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          preferences: {
            genres: [],
            actors: [],
            directors: [],
            writers: []
          },
          ratings: [],
          watchlist: [],
          skippedContent: []
        };
        setProfile(newProfile);
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
      }
    } catch (error) {
      logger.error('Failed to load user profile:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!profile) return;

    setIsLoadingRecommendations(true);
    try {
      const recs = await learningService.getPersonalizedRecommendations(
        profile.id,
        filters
      );
      setRecommendations(recs);
    } catch (error) {
      logger.error('Failed to load recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    try {
      // Implement search logic here
      const results = []; // Placeholder
      setSearchResults(results);
    } catch (error) {
      logger.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        preferences: onboardingData.preferences,
        ratings: onboardingData.ratings || []
      };
      setProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setShowOnboarding(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-gold mb-4">CineMatch</h1>
          <p className="text-brand-light mb-8">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const validRatings = (profile?.ratings || []).filter(r => r.rating !== 'not_watched');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-brand-dark flex">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          profile={profile}
        />
        
        <main className="flex-1 p-6 ml-64">
          {activeView === 'search' && searchQuery && (
            <SearchResultsSummary
              query={searchQuery}
              results={searchResults}
              isLoading={isSearching}
            />
          )}

          {activeView === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-gold">
                  Your Recommendations
                </h1>
                <RecommendationFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
              
              {learningInsights && (
                <RealTimeLearningInsights insights={learningInsights} />
              )}
              
              <MovieRecommendations
                recommendations={recommendations}
                isLoading={isLoadingRecommendations}
                onRating={(movieId, rating) => {
                  if (profile) {
                    const updatedRatings = [...profile.ratings];
                    const existingIndex = updatedRatings.findIndex(r => r.movieId === movieId);
                    
                    if (existingIndex >= 0) {
                      updatedRatings[existingIndex] = {
                        movieId,
                        rating,
                        timestamp: new Date()
                      };
                    } else {
                      updatedRatings.push({
                        movieId,
                        rating,
                        timestamp: new Date()
                      });
                    }
                    
                    const updatedProfile = {
                      ...profile,
                      ratings: updatedRatings
                    };
                    handleProfileUpdate(updatedProfile);
                  }
                }}
              />
            </div>
          )}

          {activeView === 'profile' && profile && (
            <ProfileSection
              profile={profile}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {activeView === 'featured' && (
            <FeaturedLists />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;