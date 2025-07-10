export interface GuideStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightType: 'spotlight' | 'border' | 'pulse' | 'glow';
  icon?: string;
  actionType?: 'click' | 'hover' | 'scroll' | 'wait' | 'custom';
  actionText?: string;
  nextText?: string;
  skipText?: string;
  category: GuideCategory;
  prerequisite?: string[];
  optional?: boolean;
  showOnce?: boolean;
}

export interface GuideCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export interface GuideProgress {
  completedSteps: string[];
  skippedSteps: string[];
  currentCategory: string | null;
  currentStep: string | null;
  isActive: boolean;
  lastVisit: number;
  totalProgress: number;
  categoryProgress: Record<string, number>;
}

export interface GuideState {
  isVisible: boolean;
  currentStep: GuideStep | null;
  progress: GuideProgress;
  availableSteps: GuideStep[];
  settings: GuideSettings;
}

export interface GuideSettings {
  autoStart: boolean;
  showProgress: boolean;
  enableHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'dark' | 'light' | 'auto';
  contextualHelp: boolean;
  smartTiming: boolean;
}

export interface GuideTooltipProps {
  step: GuideStep;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  position: { x: number; y: number };
  isVisible: boolean;
}

export interface FeatureHighlightProps {
  targetSelector: string;
  type: 'spotlight' | 'border' | 'pulse' | 'glow';
  isActive: boolean;
  onClick?: () => void;
}

export interface GuideHint {
  id: string;
  text: string;
  icon?: string;
  targetSelector: string;
  condition: () => boolean;
  frequency: 'once' | 'session' | 'always';
  priority: number;
}