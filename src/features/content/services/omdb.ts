import type { Movie, TVShow, OMDbResponse, OMDbSearchResponse } from '../types';
import { logger } from '../../../shared/utils/logger';

export class OMDbService {
  private static instance: OMDbService;
  private cache = new Map<string, any>();

  static getInstance(): OMDbService {
    if (!OMDbService.instance) {
      OMDbService.instance = new OMDbService();
    }
    return OMDbService.instance;
  }

  private async makeRequest<T>(): Promise<T> {
    // OMDb devre dışı - mock data döndür
    logger.debug('OMDb service disabled, returning mock data');
    
    const mockResponse = {
      Response: 'True',
      Title: 'Mock Title',
      Year: '2024',
      Rated: 'PG-13',
      Released: '2024-01-01',
      Runtime: '120 min',
      Genre: 'Action, Drama',
      Director: 'Mock Director',
      Writer: 'Mock Writer',
      Actors: 'Mock Actor 1, Mock Actor 2',
      Plot: 'This is a mock plot for testing purposes.',
      Poster: 'https://placehold.co/300x450',
      Ratings: [
        { Source: 'Internet Movie Database', Value: '7.5/10' },
        { Source: 'Rotten Tomatoes', Value: '75%' },
        { Source: 'Metacritic', Value: '70/100' }
      ],
      Metascore: '70',
      imdbRating: '7.5',
      imdbVotes: '1,000',
      imdbID: 'tt1234567',
      Type: 'movie',
      totalSeasons: '1',
      BoxOffice: '$1,000,000',
      Production: 'Mock Production',
      Website: 'https://example.com'
    } as T;

    return mockResponse;
  }

  async getMovieByIMDbId(imdbId: string): Promise<OMDbResponse> {
    logger.debug(`OMDb disabled: getMovieByIMDbId called with ${imdbId}`);
    return this.makeRequest<OMDbResponse>();
  }

  async getMovieByTitle(title: string, year?: string): Promise<OMDbResponse> {
    logger.debug(`OMDb disabled: getMovieByTitle called with ${title} ${year || ''}`);
    return this.makeRequest<OMDbResponse>();
  }

  async searchMovies(query: string, year?: string): Promise<OMDbSearchResponse> {
    logger.debug(`OMDb disabled: searchMovies called with ${query} ${year || ''}`);
    return {
      Response: 'True',
      Search: [
        {
          Title: 'Mock Movie',
          Year: '2024',
          imdbID: 'tt1234567',
          Type: 'movie',
          Poster: 'https://placehold.co/300x450'
        }
      ],
      totalResults: '1'
    } as OMDbSearchResponse;
  }

  async searchTVShows(query: string, year?: string): Promise<OMDbSearchResponse> {
    logger.debug(`OMDb disabled: searchTVShows called with ${query} ${year || ''}`);
    return {
      Response: 'True',
      Search: [
        {
          Title: 'Mock TV Show',
          Year: '2024',
          imdbID: 'tt1234568',
          Type: 'series',
          Poster: 'https://placehold.co/300x450'
        }
      ],
      totalResults: '1'
    } as OMDbSearchResponse;
  }

  async enhanceTMDbContent(content: Movie | TVShow): Promise<Movie | TVShow> {
    logger.debug(`OMDb disabled: enhanceTMDbContent called for ${content.id}`);
    // OMDb devre dışı - orijinal içeriği döndür
    return content;
  }

  async getBatchOMDbData(imdbIds: string[]): Promise<Record<string, OMDbResponse>> {
    logger.debug(`OMDb disabled: getBatchOMDbData called for ${imdbIds.length} IDs`);
    const results: Record<string, OMDbResponse> = {};
    
    for (const imdbId of imdbIds) {
      results[imdbId] = await this.getMovieByIMDbId(imdbId);
    }

    return results;
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('OMDb cache cleared (service disabled)');
  }

  getCacheStats() {
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      serviceStatus: 'disabled'
    };
  }
}

export const omdbService = OMDbService.getInstance(); 