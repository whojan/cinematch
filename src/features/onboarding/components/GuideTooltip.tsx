import React, { useMemo } from 'react';
import { GuideTooltipProps } from '../types/guide';
import { 
  Compass, Search, Layers, Eye, Filter, Star, Keyboard, TrendingUp,
  Brain, Sliders, RefreshCw, User, Bookmark, Download, Settings,
  Cpu, HelpCircle, ArrowRight, SkipForward, X
} from 'lucide-react';

const iconMap = {
  compass: Compass,
  search: Search,
  layers: Layers,
  discover: Eye,
  filter: Filter,
  collection: Star,
  star: Star,
  keyboard: Keyboard,
  'trending-up': TrendingUp,
  brain: Brain,
  sliders: Sliders,
  refresh: RefreshCw,
  user: User,
  bookmark: Bookmark,
  download: Download,
  settings: Settings,
  cpu: Cpu,
  help: HelpCircle
};

export const GuideTooltip: React.FC<GuideTooltipProps> = ({
  step,
  onNext,
  onSkip,
  onClose,
  position,
  isVisible
}) => {
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || HelpCircle;

  const tooltipStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 60,
      maxWidth: '400px',
      minWidth: '320px'
    };

    switch (step.position) {
      case 'top':
        return {
          ...baseStyle,
          left: position.x - 200,
          top: position.y - 20,
          transform: 'translateY(-100%)'
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: position.x - 200,
          top: position.y + 20
        };
      case 'left':
        return {
          ...baseStyle,
          left: position.x - 20,
          top: position.y - 100,
          transform: 'translateX(-100%)'
        };
      case 'right':
        return {
          ...baseStyle,
          left: position.x + 20,
          top: position.y - 100
        };
      case 'center':
      default:
        return {
          ...baseStyle,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  }, [step.position, position]);

  const arrowStyle = useMemo(() => {
    const arrowBase = 'absolute w-0 h-0 border-solid';
    
    switch (step.position) {
      case 'top':
        return `${arrowBase} border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800 top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${arrowBase} border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-800 bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${arrowBase} border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-slate-800 left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${arrowBase} border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-slate-800 right-full top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  }, [step.position]);

  if (!isVisible) return null;

  return (
    <div
      style={tooltipStyle}
      className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Arrow */}
      {step.position !== 'center' && (
        <div className={arrowStyle} />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${step.category.color} bg-opacity-20`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{step.title}</h3>
            <span className="text-slate-400 text-sm">{step.category.name}</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-slate-200 leading-relaxed mb-4">
          {step.description}
        </p>
        
        {/* Action Hint */}
        {step.actionType && step.actionText && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4 border border-slate-600/50">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-200 text-sm font-medium">
                {step.actionText}
              </span>
            </div>
          </div>
        )}
        
        {/* Optional Badge */}
        {step.optional && (
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 mb-4">
            <span className="text-blue-200 text-xs font-medium">İsteğe Bağlı</span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-slate-600 bg-slate-800/50">
        <button
          onClick={onSkip}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <SkipForward className="h-4 w-4" />
          <span className="text-sm">{step.skipText || 'Atla'}</span>
        </button>
        
        <button
          onClick={onNext}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <span className="font-medium">{step.nextText || 'Devam Et'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};