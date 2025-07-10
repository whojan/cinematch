import React from 'react';
import { 
  Sparkles, 
  Settings, 
  Bookmark, 
  Star,
  TrendingUp,
  Search,
  X,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  User,
  Award,
  Film,
  Eye
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExport: () => string;
  onImport: (data: string) => void;
  onClear: () => void;
  onRefreshRecommendations: () => void;
  clearLoading?: boolean;
  recommendationsLoading?: boolean;
  ratingsCount: number;
  watchlistCount: number;
  learningPhase: string;
  hasEnoughRatingsForAI: boolean;
  showingCuratedMovies: boolean;
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onExport,
  onImport,
  onClear,
  onRefreshRecommendations,
  clearLoading = false,
  recommendationsLoading = false,
  ratingsCount,
  watchlistCount,
  learningPhase,
  hasEnoughRatingsForAI,
  showingCuratedMovies,
  isMobile,
  isOpen,
  onToggle
}) => {
  const menuItems = [
    {
      id: 'discovery',
      label: 'Arama',
      icon: Search,
      description: 'İçerik arama ve keşif',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'recommendations',
      label: 'AI Önerileri',
      icon: Sparkles,
      description: 'Kişiselleştirilmiş öneriler',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      disabled: !hasEnoughRatingsForAI,
      badge: !hasEnoughRatingsForAI ? `${ratingsCount}/10` : undefined
    },
    {
      id: 'watchlist',
      label: 'İzleme Listesi',
      icon: Bookmark,
      description: 'Kaydedilen içerikler',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-500/30',
      badge: watchlistCount > 0 ? `${watchlistCount}` : undefined
    },
    {
      id: 'rated',
      label: 'Puanladıklarım',
      icon: Star,
      description: 'Puanladığın içerikler',
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'from-yellow-500/10 to-amber-500/10',
      borderColor: 'border-yellow-500/30',
      badge: ratingsCount > 0 ? `${ratingsCount}` : undefined
    },
    {
      id: 'skipped',
      label: 'Atlananlar',
      icon: Eye,
      description: 'Atladığın içerikler',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-500/10 to-amber-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      description: 'Kullanıcı profili ve ayarlar',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      id: 'bfi',
      label: 'BFI En İyi Filmler',
      icon: Award,
      description: 'Sight & Sound En İyi 250',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/10 to-purple-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      id: 'bfi-directors',
      label: 'BFI Yönetmenler Listesi',
      icon: Film,
      description: 'Directors 100 Greatest',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/10 to-purple-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      id: 'best300',
      label: 'Rotten Tomatoes En İyi Filmler',
      icon: undefined,
      description: 'Tüm Zamanların En İyi Filmlerii',
      color: 'from-pink-500 to-red-500',
      bgColor: 'from-pink-500/10 to-red-500/10',
      borderColor: 'border-pink-500/30',
      emoji: '🍅'
    },
  ];

  const quickActions = [
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: Settings,
      onClick: () => {
        onTabChange('settings');
        // Mobil ekranlarda sayfa seçildikten sonra sidebar'ı kapat
        if (isMobile && isOpen) {
          onToggle();
        }
      },
      color: 'from-slate-500 to-gray-500'
    },
    {
      id: 'export',
      label: 'Verileri Dışa Aktar',
      icon: Download,
      onClick: () => {
        try {
          const data = onExport();
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cinematch-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Export error:', error);
          alert('Veri dışa aktarma sırasında hata oluştu!');
        }
      },
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'import',
      label: 'Verileri İçe Aktar',
      icon: Upload,
      onClick: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              if (content) {
                onImport(content);
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'clear',
      label: 'Tüm Verileri Temizle',
      icon: Trash2,
      onClick: onClear,
      disabled: clearLoading,
      color: 'from-red-500 to-pink-500'
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-theme-primary border-r border-theme-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-primary">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-theme-primary tracking-tight">CineMatch</h1>
        </div>
        {isMobile && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-colors"
          >
            <X className="h-5 w-5 text-theme-secondary" />
          </button>
        )}
      </div>

      {/* Optimizasyon Modu Bilgisi */}
      {showingCuratedMovies && learningPhase === 'optimizing' && (
        <div className="p-3 border-b border-theme-primary">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <TrendingUp className="h-3 w-3 text-amber-400" />
                </div>
                <span className="text-amber-300 font-semibold text-xs">Optimizasyon Modu</span>
              </div>
              <button
                onClick={onRefreshRecommendations}
                disabled={recommendationsLoading}
                className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-600/50 disabled:to-orange-600/50 text-white transition-all duration-200"
                title="Yenile"
              >
                <RefreshCw className={`h-3 w-3 ${recommendationsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-amber-200 text-xs">
              {ratingsCount} içerik puanlandı • Sürekli öğreniyor
            </p>
          </div>
        </div>
      )}

      {/* Menü */}
      <nav className="flex-1 py-2 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const Emoji = item.emoji;
          const isActive = activeTab === item.id;
          const isDisabled = item.disabled;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isDisabled) {
                  onTabChange(item.id);
                  // Mobil ekranlarda sayfa seçildikten sonra sidebar'ı kapat
                  if (isMobile && isOpen) {
                    onToggle();
                  }
                }
              }}
              disabled={isDisabled}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 justify-start text-left
                ${isActive ? 'bg-theme-secondary text-amber-400' : isDisabled ? 'text-theme-tertiary cursor-not-allowed' : 'text-theme-secondary hover:bg-theme-secondary hover:text-amber-300'}`}
            >
              {Emoji ? (
                <span className="text-xl leading-none">{Emoji}</span>
              ) : (
                Icon && <Icon className={`h-5 w-5 ${isDisabled ? 'opacity-50' : ''}`} />
              )}
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Hızlı Erişim (Sticky Bottom) */}
      <div className="sticky bottom-0 left-0 w-full bg-theme-primary border-t border-theme-primary px-2 py-2 z-10">
        <div className="flex flex-col gap-1">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isDisabled = action.disabled;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={isDisabled}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150
                  ${isDisabled ? 'text-theme-tertiary cursor-not-allowed' : 'text-theme-secondary hover:bg-theme-secondary hover:text-amber-300'}`}
              >
                <Icon className={`h-4 w-4 ${isDisabled ? 'opacity-50' : ''}`} />
                <span>{action.label}</span>
                {action.id === 'clear' && clearLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-secondary border-t-transparent"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-theme-primary text-center">
        <p className="text-xs text-theme-tertiary">AI Destekli Öneri Sistemi</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full w-52 bg-theme-primary
          border-r border-theme-primary z-50 transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="hidden lg:block w-52 bg-theme-primary border-r border-theme-primary">
      {sidebarContent}
    </div>
  );
};

export default Sidebar; 