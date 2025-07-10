import React, { useState, useEffect } from 'react';
import { RealTimeLearningService } from '../services/realTimeLearningService';
import type { UserProfile, UserRating } from '../types';

interface RealTimeLearningInsightsProps {
  profile: UserProfile | null;
  recentRatings: UserRating[];
  isVisible: boolean;
  onClose: () => void;
}

export const RealTimeLearningInsights: React.FC<RealTimeLearningInsightsProps> = ({
  profile,
  recentRatings,
  isVisible,
  onClose: _onClose
}) => {
  const [analytics, setAnalytics] = useState<{
    totalEvents: number;
    recentEvents: any[];
    learningRate: number;
    averageConfidenceChange: number;
    mostActiveGenres: string[];
    learningPhase: string;
  } | null>(null);

  const [insights, setInsights] = useState<{
    insights: string[];
    recommendations: string[];
    confidence: number;
  } | null>(null);

  const [config, setConfig] = useState(RealTimeLearningService.getConfig());

  useEffect(() => {
    if (isVisible && profile) {
      // Get learning analytics
      const learningAnalytics = RealTimeLearningService.getLearningAnalytics();
      setAnalytics(learningAnalytics);

      // Get learning insights
      const learningInsights = RealTimeLearningService.getLearningInsights(profile, recentRatings);
      setInsights(learningInsights);
    }
  }, [isVisible, profile, recentRatings]);

  const handleConfigUpdate = (newConfig: Partial<typeof config>) => {
    RealTimeLearningService.updateConfig(newConfig);
    setConfig(RealTimeLearningService.getConfig());
  };

  const handleClearHistory = () => {
    RealTimeLearningService.clearLearningHistory();
    setAnalytics(RealTimeLearningService.getLearningAnalytics());
  };

  const handleReplayRatings = () => {
    RealTimeLearningService.replayRatingsAsLearningEvents(recentRatings);
    setAnalytics(RealTimeLearningService.getLearningAnalytics());
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gerçek Zamanlı Öğrenme Analizi</h2>
      </div>

      {/* Geçmiş temizlendiyse tekrar başlat butonu */}
      {analytics && analytics.totalEvents === 0 && recentRatings.length > 0 && (
        <div className="bg-blue-900/60 border border-blue-700 rounded-lg p-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-blue-200 text-sm">Puanladığınız içeriklerle tekrar öğrenmeyi başlatabilirsiniz.</span>
            <span className="px-2 py-1 rounded bg-blue-700 text-blue-200 text-xs font-semibold ml-2">
              Aşama: {analytics.learningPhase}
            </span>
          </div>
          <button
            onClick={handleReplayRatings}
            className="ml-4 px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Tekrar Öğrenmeyi Başlat
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Insights */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Öğrenme İçgörüleri</h3>
          {insights ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Güven Seviyesi:</span>
                <div className="flex items-center">
                  <div className="w-20 bg-slate-600 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${insights.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {Math.round(insights.confidence * 100)}%
                  </span>
                </div>
              </div>

              {insights.insights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Son Güncellemeler:</h4>
                  <ul className="space-y-1">
                    {insights.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Öneriler:</h4>
                  <ul className="space-y-1">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start">
                        <span className="text-green-400 mr-2">→</span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">İçgörüler yükleniyor...</p>
          )}
        </div>

        {/* Learning Analytics */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3">Öğrenme İstatistikleri</h3>
          {analytics ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{analytics.totalEvents}</div>
                  <div className="text-xs text-slate-400">Toplam Olay</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(analytics.learningRate * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">Öğrenme Hızı</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Aktif Türler:</h4>
                <div className="flex flex-wrap gap-1">
                  {analytics.mostActiveGenres.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Öğrenme Aşaması:</h4>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                  {analytics.learningPhase}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">İstatistikler yükleniyor...</p>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Adaptif Öğrenme Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableRealTime"
              checked={config.enableRealTimeUpdates}
              onChange={(e) => handleConfigUpdate({ enableRealTimeUpdates: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enableRealTime" className="text-sm text-slate-300">
              Gerçek Zamanlı Güncellemeler
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableNeural"
              checked={config.enableNeuralRetraining}
              onChange={(e) => handleConfigUpdate({ enableNeuralRetraining: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enableNeural" className="text-sm text-slate-300">
              Sinir Ağı Yeniden Eğitimi
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableConfidence"
              checked={config.enableConfidenceAdjustment}
              onChange={(e) => handleConfigUpdate({ enableConfidenceAdjustment: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enableConfidence" className="text-sm text-slate-300">
              Güven Ayarlaması
            </label>
          </div>

          <div>
            <label htmlFor="learningRate" className="block text-sm text-slate-300 mb-1">
              Öğrenme Hızı: {Math.round(config.learningRate * 100)}%
            </label>
            <input
              type="range"
              id="learningRate"
              min="0.05"
              max="0.2"
              step="0.01"
              value={config.learningRate}
              onChange={(e) => handleConfigUpdate({ learningRate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="minRating" className="block text-sm text-slate-300 mb-1">
              Minimum Öğrenme Puanı: {config.minRatingForLearning} <span className="text-slate-400 text-xs">(10 üzerinden, bu puanın altındaki içerikler öğrenmede dikkate alınmaz)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="minRating"
                min="1"
                max="10"
                step="1"
                value={config.minRatingForLearning}
                onChange={(e) => handleConfigUpdate({ minRatingForLearning: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-blue-300 font-semibold text-sm w-6 text-center">{config.minRatingForLearning}</span>
            </div>
          </div>

          <div>
            <label htmlFor="maxEvents" className="block text-sm text-slate-300 mb-1">
              Maksimum Olay: {config.maxLearningEvents}
            </label>
            <input
              type="range"
              id="maxEvents"
              min="100"
              max="2000"
              step="100"
              value={config.maxLearningEvents}
              onChange={(e) => handleConfigUpdate({ maxLearningEvents: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-start">
        <button
          onClick={handleClearHistory}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Öğrenme Geçmişini Temizle
        </button>
      </div>
    </div>
  );
}; 