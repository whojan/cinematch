

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private sentryEnabled = false;
  private logBuffer: Array<{ level: string; message: string; data?: any; timestamp: number }> = [];
  private maxBufferSize = 100;

  debug(message: string, data?: any): void {
    this.addToBuffer('debug', message, data);
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: any): void {
    this.addToBuffer('info', message, data);
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '');
    }
    this.sendToAnalytics();
  }

  warn(message: string, data?: any): void {
    this.addToBuffer('warn', message, data);
    console.warn(`[WARN] ${message}`, data || '');
    this.sendToAnalytics();
  }

  error(message: string, error?: Error | any): void {
    this.addToBuffer('error', message, error);
    console.error(`[ERROR] ${message}`, error || '');
    
    if (this.sentryEnabled && !this.isDevelopment) {
      this.sendToSentry();
    }
  }

  private addToBuffer(level: string, message: string, data?: any): void {
    this.logBuffer.push({
      level,
      message,
      data,
      timestamp: Date.now()
    });

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private sendToAnalytics(): void {
    if (!this.isDevelopment) {
      // Analytics service integration placeholder
      // Example: analytics.track('log_event', { level, message, data });
    }
  }

  private sendToSentry(): void {
    // Sentry integration placeholder
    // Example: Sentry.captureException(new Error(message), { extra: error });
  }

  // Performance logging with better memory management
  private timers = new Map<string, number>();

  time(label: string): void {
    this.timers.set(label, performance.now());
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.timers.delete(label);
      
      if (this.isDevelopment) {
        console.timeEnd(label);
        console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      }
      
      // Log performance metrics for monitoring
      this.info(`Performance: ${label}`, { duration: Math.round(duration) });
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): Array<{ level: string; message: string; data?: any; timestamp: number }> {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }
}

export const logger = new Logger();

// Convenience functions
export const debug = (message: string, data?: any) => logger.debug(message, data);
export const info = (message: string, data?: any) => logger.info(message, data);
export const warn = (message: string, data?: any) => logger.warn(message, data);
export const error = (message: string, error?: any) => logger.error(message, error);