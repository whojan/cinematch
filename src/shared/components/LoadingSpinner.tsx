import React, { useMemo } from 'react';
import { Sparkles, Film } from 'lucide-react';

interface LoadingSpinnerProps {
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ progress }) => {
  const percentage = useMemo(() => progress ? (progress.current / progress.total) * 100 : 0, [progress]);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Ana Spinner */}
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-600 border-t-amber-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse flex items-center justify-center">
            <Film className="h-6 w-6 text-white" />
          </div>
        </div>
        
        {/* Sparkles around spinner */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Sparkles className="h-4 w-4 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Progress Bar ve Mesaj */}
      {progress && progress.total > 0 && (
        <div className="w-full max-w-md space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
            <div 
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-4 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${Math.min(100, percentage)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          {/* Progress Text */}
          <div className="text-center space-y-2">
            <p className="text-amber-400 font-semibold text-lg">
              {progress.message}
            </p>
            <p className="text-slate-400 text-sm">
              {progress.current} / {progress.total} tamamlandı
            </p>
            <div className="text-amber-500 font-bold text-xl">
              %{Math.round(percentage)}
            </div>
          </div>
        </div>
      )}

      {/* Genel Yükleme Mesajı */}
      {(!progress || progress.total === 0) && (
        <div className="text-center space-y-3">
          <p className="text-amber-400 font-semibold text-xl">
            İçerikler yükleniyor...
          </p>
          <p className="text-slate-400 text-sm">
            Lütfen bekleyin
          </p>
        </div>
      )}

      {/* Animasyonlu Noktalar */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  );
});

export default LoadingSpinner;