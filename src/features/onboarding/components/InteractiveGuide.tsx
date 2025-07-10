import React, { useEffect, useState, useCallback } from 'react';
import { GuideTooltip } from './GuideTooltip';
import { FeatureHighlight } from './FeatureHighlight';
import { GuideProgress } from './GuideProgress';
import { GuideState } from '../types/guide';
import { guideService } from '../services/guideService';
import { X, HelpCircle, RotateCcw, Settings } from 'lucide-react';

interface InteractiveGuideProps {
  autoStart?: boolean;
  className?: string;
}

export const InteractiveGuide: React.FC<InteractiveGuideProps> = ({
  autoStart = false,
  className = ''
}) => {
  const [guideState, setGuideState] = useState<GuideState>(guideService.getState());
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const unsubscribe = guideService.subscribe(setGuideState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoStart && !guideState.progress.isActive && guideState.progress.completedSteps.length === 0) {
      guideService.startGuide();
    }
  }, [autoStart, guideState.progress.isActive, guideState.progress.completedSteps.length]);

  const calculateTooltipPosition = useCallback((targetSelector: string) => {
    const element = document.querySelector(targetSelector);
    if (!element) return { x: 0, y: 0 };

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    return {
      x: rect.left + scrollX + rect.width / 2,
      y: rect.top + scrollY + rect.height / 2
    };
  }, []);

  useEffect(() => {
    if (guideState.currentStep?.targetSelector) {
      const position = calculateTooltipPosition(guideState.currentStep.targetSelector);
      setTooltipPosition(position);

      // Scroll element into view with smooth behavior
      const element = document.querySelector(guideState.currentStep.targetSelector);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [guideState.currentStep, calculateTooltipPosition]);

  const handleNext = useCallback(() => {
    guideService.nextStep();
  }, []);

  const handleSkip = useCallback(() => {
    guideService.skipStep();
  }, []);

  const handleClose = useCallback(() => {
    guideService.endGuide();
  }, []);

  const handleRestart = useCallback(() => {
    guideService.restartGuide();
  }, []);

  const handleStartGuide = useCallback(() => {
    guideService.startGuide();
  }, []);

  if (!guideState.isVisible && !guideState.progress.isActive) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {/* Quick Help Button */}
        <div className="flex flex-col items-end space-y-3">
          <button
            onClick={handleStartGuide}
            className="group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            title="Rehberi Başlat"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
          
          {guideState.progress.completedSteps.length > 0 && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-all duration-300"
              title="Rehber Ayarları"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute bottom-16 right-0 bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Rehber Ayarları</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <GuideProgress 
                progress={guideService.getProgressSummary()} 
                isCompact={true}
              />
              
              <div className="pt-3 border-t border-slate-600">
                <button
                  onClick={handleRestart}
                  className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Rehberi Yeniden Başlat</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!guideState.currentStep) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Feature Highlight */}
      <FeatureHighlight
        targetSelector={guideState.currentStep.targetSelector}
        type={guideState.currentStep.highlightType}
        isActive={guideState.isVisible}
        onClick={guideState.currentStep.actionType === 'click' ? handleNext : undefined}
      />
      
      {/* Tooltip */}
      <GuideTooltip
        step={guideState.currentStep}
        onNext={handleNext}
        onSkip={handleSkip}
        onClose={handleClose}
        position={tooltipPosition}
        isVisible={guideState.isVisible}
      />
      
      {/* Progress Indicator */}
      {guideState.settings.showProgress && (
        <div className="absolute top-6 right-6">
          <GuideProgress 
            progress={guideService.getProgressSummary()} 
            isCompact={false}
          />
        </div>
      )}
      
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-6 left-6 bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded-full transition-colors"
        title="Rehberi Kapat"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};