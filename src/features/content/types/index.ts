// Ortak alanlar için temel interface
export interface BaseContent {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  keywords?: Keyword[];
  credits?: Credits;
  videos?: VideoResponse;
  media_type?: 'movie' | 'tv';
  original_language?: string;

  external_ids?: {
    facebook_id?: string;
    instagram_id?: string;
    twitter_id?: string;
  };
}

export interface Movie extends BaseContent {
  title: string;
  release_date: string;
  runtime?: number;
  media_type?: 'movie';
  adult?: boolean;
  plot?: string;
}

export interface TVShow extends BaseContent {
  name: string;
  first_air_date: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  media_type?: 'tv';
  adult?: boolean;
  plot?: string;
  runtime?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface VideoResponse {
  results: Video[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

// Enhanced User Rating with contextual data - 1-10 SISTEM
export interface UserRating {
  movieId: number;
  rating: number | 'not_watched' | 'not_interested' | 'skip'; // 1-10 arası sayı
  timestamp: number;
  mediaType?: 'movie' | 'tv';
  // New contextual fields
  watchTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  watchDay?: 'weekday' | 'weekend';
  mood?: 'happy' | 'sad' | 'excited' | 'relaxed' | 'stressed';
  watchContext?: 'alone' | 'family' | 'friends' | 'date';
  completionRate?: number; // 0-1, how much of the content was watched
  rewatched?: boolean;
  // Quality-based rating context
  qualityRating?: number; // Separate quality rating (1-10)
  contentRating?: number; // Content preference rating (1-10)
}

// Enhanced User Profile with multi-dimensional features - 1-10 SISTEM
export interface UserProfile {
  // Demographics - Yeni eklenen alanlar
  demographics?: {
    age?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    country?: string;
    language?: string; // Ana dil
    education?: 'primary' | 'secondary' | 'university' | 'graduate' | 'other';
    occupation?: string;
    income?: 'low' | 'medium' | 'high' | 'prefer_not_to_say';
    relationshipStatus?: 'single' | 'in_relationship' | 'married' | 'divorced' | 'other';
    hasChildren?: boolean;
    childrenAge?: number[];
  };
  
  // Content preferences based on demographics
  demographicPreferences?: {
    ageBasedGenres?: Record<string, Record<number, number>>; // age group -> genre preferences
    genderBasedGenres?: Record<string, Record<number, number>>; // gender -> genre preferences
    countryBasedGenres?: Record<string, Record<number, number>>; // country -> genre preferences
    languagePreferences?: Record<string, number>; // language -> preference score
  };
  
  // Basic preferences
  genreDistribution: Record<number, number>;
  periodPreference: Record<string, number>;
  
  // Quality-aware genre preferences
  genreQualityDistribution: Record<number, {
    averageQuality: number; // Average quality rating for this genre
    averagePreference: number; // Average content preference for this genre (1-10)
    count: number;
  }>;
  
  // New multi-dimensional preferences
  moodPreference?: Record<string, number>; // mood -> preference score
  tempoPreference: Record<string, number>; // fast-paced, slow-burn, etc.
  themePreference?: Record<string, number>; // themes from keywords/topics
  
  // Enhanced actor/director preferences with context
  favoriteActors: Record<number, { 
    name: string; 
    count: number; // Toplam puan (1-10 sistem)
    averageRating?: number; // Ortalama puan (1-10)
    preferredRoles?: string[]; // character types they like this actor in
  }>;
  favoriteDirectors: Record<number, { 
    name: string; 
    count: number; // Toplam puan (1-10 sistem)
    averageRating?: number; // Ortalama puan (1-10)
    preferredGenres?: number[]; // genres they like this director in
  }>;
  
  // Temporal patterns
  timeBasedPreferences?: {
    morning: Record<number, number>; // genre preferences by time
    afternoon: Record<number, number>;
    evening: Record<number, number>;
    night: Record<number, number>;
  };
  
  // Short-term vs long-term preferences
  shortTermProfile?: {
    recentGenres: Record<number, number>; // last 2 weeks
    recentMoods: Record<string, number>;
    trendingInterests: string[];
  };
  
  longTermProfile?: {
    coreGenres: Record<number, number>; // all-time preferences
    stablePreferences: Record<string, any>;
    characteristicTraits: string[];
  };
  
  // Quality and content preferences
  qualityTolerance?: {
    minRating: number; // 1-10 sistem
    minVoteCount: number;
    preferredDecades: string[];
  };
  
  // Diversity metrics
  diversityScore?: number; // how diverse user's tastes are
  explorationWillingness?: number; // tendency to try new things
  
  // Basic stats - 1-10 SISTEM
  averageScore: number; // 1-10 arası ortalama
  totalRatings: number;
  learningPhase: 'initial' | 'profiling' | 'testing' | 'optimizing';
  accuracyScore?: number;
  lastUpdated: number;
}

// Enhanced Recommendation with explanation
export interface Recommendation {
  movie: Movie | TVShow;
  matchScore: number;
  reasons: string[];
  confidence: number; // how confident the system is
  novelty: number; // how novel/surprising this recommendation is
  diversity: number; // how different this is from user's usual preferences
  explanation: {
    primaryFactors: string[]; // main reasons for recommendation
    secondaryFactors: string[]; // supporting reasons
    riskFactors: string[]; // potential reasons user might not like it
  };
  recommendationType: 'safe' | 'exploratory' | 'serendipitous';
}

export interface TMDbResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Enhanced Learning Metrics with A/B testing support
export interface LearningMetrics {
  phase: 'initial' | 'profiling' | 'testing' | 'optimizing';
  totalRatings: number;
  accuracyScore: number;
  
  // Performance metrics
  precision?: Record<string, number>; // precision@k for different k values
  recall?: Record<string, number>; // recall@k
  ndcg?: Record<string, number>; // nDCG@k
  
  // Diversity and novelty metrics
  diversityScore?: number; // how diverse recommendations are
  noveltyScore?: number; // how novel recommendations are
  serendipityScore?: number; // unexpected but relevant recommendations
  
  // User engagement metrics
  clickThroughRate?: number;
  watchCompletionRate?: number;
  reWatchRate?: number;
  
  // A/B testing metrics
  testGroup?: string;
  conversionRate?: number;
  userSatisfactionScore?: number;
  
  // Test prediction metrics
  testCorrectPredictions?: number;
  testTotalPredictions?: number;
  
  lastPhaseChange: number;
}

export interface ProgressCallback {
  (progress: { current: number; total: number; message: string }): void;
}

export interface RecommendationFilters {
  genres: number[];
  minYear: number;
  maxYear: number;
  minRating: number;
  maxRating: number;
  mediaType: 'all' | 'movie' | 'tv';
  sortBy: 'match_score' | 'rating' | 'year' | 'title';
  minMatchScore: number; // Yeni: Minimum eşleşme oranı filtresi
  // New filters
  mood?: string;
  tempo?: string;
  novelty?: 'familiar' | 'mixed' | 'exploratory';
  timeContext?: 'morning' | 'afternoon' | 'evening' | 'night';
  // Language filter - Yeni eklenen
  languages?: string[]; // ISO 639-1 language codes (tr, en, es, fr, etc.)
}

// Person Filmography Types
export interface Credit {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  job?: string;
  poster_path: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  overview?: string;
  adult?: boolean;
}

export interface PersonCreditsResponse {
  cast: Credit[];
  crew: Credit[];
  id: number;
}

// Person Search Types
export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: (Movie | TVShow)[];
  popularity?: number;
  adult?: boolean;
}

export interface SearchResult {
  movies: Movie[];
  tvShows: TVShow[];
  people: Person[];
  totalResults: number;
  searchType: 'content' | 'person' | 'mixed';
}

// Error Types
export class TMDbError extends Error {
  statusCode?: number;
  statusMessage?: string;
  isNetworkError?: boolean;
  isApiError?: boolean;

  constructor(message: string, statusCode?: number, statusMessage?: string, isNetworkError?: boolean, isApiError?: boolean) {
    super(message);
    this.name = 'TMDbError';
    if (statusCode !== undefined) this.statusCode = statusCode;
    if (statusMessage !== undefined) this.statusMessage = statusMessage;
    if (isNetworkError !== undefined) this.isNetworkError = isNetworkError;
    if (isApiError !== undefined) this.isApiError = isApiError;
  }
}

export interface TMDbErrorResponse {
  success: false;
  status_code: number;
  status_message: string;
}

export interface PersonFilmographyState {
  movieCredits: Credit[];
  tvCredits: Credit[];
  loading: boolean;
  error: string | null;
}

// Enhanced Recommendation Algorithm Types
export interface UserPreferences {
  genres: Record<number, number>;
  actors: Record<number, number>;
  directors: Record<number, number>;
  periods: Record<string, number>;
  moods?: Record<string, number>;
  themes?: Record<string, number>;
  averageRating: number; // 1-10 sistem
  totalRatings: number;
}

export interface ContentFeatures {
  genres: number[];
  cast: number[];
  crew: number[];
  year: number;
  rating: number;
  popularity: number;
  keywords?: string[];
  mood?: string[];
  tempo?: string;
  themes?: string[];
}

export interface SimilarityScore {
  contentBased: number;
  collaborative: number;
  hybrid: number;
  temporal?: number; // time-based similarity
  contextual?: number; // context-based similarity
}

export interface RecommendationStrategy {
  profileWeight: number;
  surpriseWeight: number;
  diversityWeight: number;
  temporalWeight?: number; // weight for time-based preferences
  contextualWeight?: number; // weight for contextual preferences
}

// Content Analysis Types
export interface ContentAnalysis {
  mood?: string; // extracted mood from overview/keywords
  tempo?: 'fast-paced' | 'moderate' | 'slow-burn';
  themes?: string[]; // extracted themes
  complexity?: 'simple' | 'moderate' | 'complex';
  emotionalIntensity?: number; // 0-1 scale
}

// User Behavior Analytics
export interface UserBehavior {
  sessionDuration?: number;
  interactionCount?: number;
  searchQueries?: string[];
  clickPatterns?: string[];
  timeSpentOnRecommendations?: number;
  feedbackGiven?: number;
}

// A/B Testing Framework
export interface ABTestConfig {
  testName: string;
  variants: string[];
  trafficSplit: Record<string, number>;
  metrics: string[];
  startDate: number;
  endDate: number;
}

export interface ABTestResult {
  variant: string;
  conversionRate: number;
  userSatisfaction: number;
  engagementMetrics: Record<string, number>;
  statisticalSignificance: number;
}

// OMDb API tipleri
export interface OMDbResponse {
  Response: 'True' | 'False';
  Error?: string;
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Poster?: string;
  Ratings?: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  Type?: string;
  totalSeasons?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
}

export interface OMDbSearchResponse {
  Response: 'True' | 'False';
  Error?: string;
  Search?: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }>;
  totalResults?: string;
}

// Enhanced content with additional data
export interface EnhancedContent extends BaseContent {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}