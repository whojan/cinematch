import { GuideState, GuideStep, GuideProgress, GuideSettings, GuideHint } from '../types/guide';
import { guideSteps, guideCategories, contextualHints } from '../data/guideSteps';

class GuideService {
  private state: GuideState;
  private listeners: ((state: GuideState) => void)[] = [];
  private storageKey = 'cinematch_guide_progress';
  private settingsKey = 'cinematch_guide_settings';

  constructor() {
    this.state = this.initializeState();
    this.loadProgress();
    this.loadSettings();
  }

  private initializeState(): GuideState {
    return {
      isVisible: false,
      currentStep: null,
      progress: {
        completedSteps: [],
        skippedSteps: [],
        currentCategory: null,
        currentStep: null,
        isActive: false,
        lastVisit: Date.now(),
        totalProgress: 0,
        categoryProgress: {}
      },
      availableSteps: [],
      settings: {
        autoStart: true,
        showProgress: true,
        enableHints: true,
        animationSpeed: 'normal',
        theme: 'dark',
        contextualHelp: true,
        smartTiming: true
      }
    };
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const progress = JSON.parse(saved);
        this.state.progress = { ...this.state.progress, ...progress };
        this.updateAvailableSteps();
        this.calculateProgress();
      }
    } catch (error) {
      console.warn('Failed to load guide progress:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(this.settingsKey);
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load guide settings:', error);
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.progress));
    } catch (error) {
      console.warn('Failed to save guide progress:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.state.settings));
    } catch (error) {
      console.warn('Failed to save guide settings:', error);
    }
  }

  private updateAvailableSteps(): void {
    const { completedSteps, skippedSteps } = this.state.progress;
    
    this.state.availableSteps = guideSteps.filter(step => {
      // Skip if already completed or skipped
      if (completedSteps.includes(step.id) || skippedSteps.includes(step.id)) {
        return false;
      }

      // Check prerequisites
      if (step.prerequisite) {
        const prerequisitesMet = step.prerequisite.every(prereq => 
          completedSteps.includes(prereq)
        );
        if (!prerequisitesMet) return false;
      }

      // Check if element exists on page
      if (step.targetSelector && !document.querySelector(step.targetSelector)) {
        return false;
      }

      return true;
    });
  }

  private calculateProgress(): void {
    const totalSteps = guideSteps.length;
    const completedCount = this.state.progress.completedSteps.length;
    this.state.progress.totalProgress = (completedCount / totalSteps) * 100;

    // Calculate category progress
    guideCategories.forEach(category => {
      const categorySteps = guideSteps.filter(step => step.category.id === category.id);
      const categoryCompleted = categorySteps.filter(step => 
        this.state.progress.completedSteps.includes(step.id)
      ).length;
      
      this.state.progress.categoryProgress[category.id] = 
        categorySteps.length > 0 ? (categoryCompleted / categorySteps.length) * 100 : 0;
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Public API
  public subscribe(listener: (state: GuideState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): GuideState {
    return { ...this.state };
  }

  public startGuide(categoryId?: string): void {
    this.updateAvailableSteps();
    
    let firstStep: GuideStep | null = null;
    
    if (categoryId) {
      firstStep = this.state.availableSteps.find(step => 
        step.category.id === categoryId
      ) || null;
    } else {
      firstStep = this.state.availableSteps[0] || null;
    }

    if (firstStep) {
      this.state.isVisible = true;
      this.state.currentStep = firstStep;
      this.state.progress.isActive = true;
      this.state.progress.currentStep = firstStep.id;
      this.state.progress.currentCategory = firstStep.category.id;
      
      this.saveProgress();
      this.notifyListeners();
    }
  }

  public nextStep(): void {
    if (!this.state.currentStep) return;

    this.completeStep(this.state.currentStep.id);
    
    // Find next available step
    const currentIndex = this.state.availableSteps.findIndex(
      step => step.id === this.state.currentStep?.id
    );
    
    const nextStep = this.state.availableSteps[currentIndex + 1];
    
    if (nextStep) {
      this.state.currentStep = nextStep;
      this.state.progress.currentStep = nextStep.id;
      this.state.progress.currentCategory = nextStep.category.id;
    } else {
      this.endGuide();
    }

    this.saveProgress();
    this.notifyListeners();
  }

  public skipStep(): void {
    if (!this.state.currentStep) return;

    this.state.progress.skippedSteps.push(this.state.currentStep.id);
    this.nextStep();
  }

  public completeStep(stepId: string): void {
    if (!this.state.progress.completedSteps.includes(stepId)) {
      this.state.progress.completedSteps.push(stepId);
      this.calculateProgress();
      this.updateAvailableSteps();
    }
  }

  public goToStep(stepId: string): void {
    const step = guideSteps.find(s => s.id === stepId);
    if (step && this.state.availableSteps.includes(step)) {
      this.state.currentStep = step;
      this.state.progress.currentStep = stepId;
      this.state.progress.currentCategory = step.category.id;
      this.state.isVisible = true;
      this.state.progress.isActive = true;
      
      this.saveProgress();
      this.notifyListeners();
    }
  }

  public endGuide(): void {
    this.state.isVisible = false;
    this.state.currentStep = null;
    this.state.progress.isActive = false;
    this.state.progress.currentStep = null;
    this.state.progress.lastVisit = Date.now();
    
    this.saveProgress();
    this.notifyListeners();
  }

  public restartGuide(): void {
    this.state.progress.completedSteps = [];
    this.state.progress.skippedSteps = [];
    this.state.progress.totalProgress = 0;
    this.state.progress.categoryProgress = {};
    
    this.saveProgress();
    this.startGuide();
  }

  public updateSettings(newSettings: Partial<GuideSettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners();
  }

  public getContextualHints(): GuideHint[] {
    if (!this.state.settings.contextualHelp) return [];
    
    return contextualHints.filter(hint => {
      // Check if already shown based on frequency
      const shownKey = `hint_shown_${hint.id}`;
      const shown = localStorage.getItem(shownKey);
      
      if (hint.frequency === 'once' && shown) return false;
      if (hint.frequency === 'session' && sessionStorage.getItem(shownKey)) return false;
      
      // Check condition
      try {
        return hint.condition();
      } catch {
        return false;
      }
    }).sort((a, b) => b.priority - a.priority);
  }

  public markHintShown(hintId: string): void {
    const hint = contextualHints.find(h => h.id === hintId);
    if (!hint) return;
    
    const key = `hint_shown_${hintId}`;
    if (hint.frequency === 'once') {
      localStorage.setItem(key, 'true');
    } else if (hint.frequency === 'session') {
      sessionStorage.setItem(key, 'true');
    }
  }

  public getProgressSummary() {
    const totalSteps = guideSteps.length;
    const optionalSteps = guideSteps.filter(s => s.optional).length;
    const requiredSteps = totalSteps - optionalSteps;
    const completedRequired = this.state.progress.completedSteps.filter(id => {
      const step = guideSteps.find(s => s.id === id);
      return step && !step.optional;
    }).length;

    return {
      totalSteps,
      optionalSteps,
      requiredSteps,
      completedSteps: this.state.progress.completedSteps.length,
      completedRequired,
      categories: guideCategories.map(cat => ({
        ...cat,
        progress: this.state.progress.categoryProgress[cat.id] || 0,
        steps: guideSteps.filter(s => s.category.id === cat.id).length,
        completed: guideSteps.filter(s => 
          s.category.id === cat.id && 
          this.state.progress.completedSteps.includes(s.id)
        ).length
      }))
    };
  }

  public shouldShowSmartHint(): boolean {
    if (!this.state.settings.smartTiming || !this.state.settings.enableHints) {
      return false;
    }

    const hints = this.getContextualHints();
    return hints.length > 0;
  }
}

export const guideService = new GuideService();