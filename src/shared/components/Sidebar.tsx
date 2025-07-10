import React from 'react';
import { 
  Sparkles, 
  Settings, 
  Bookmark, 
  Star,
  TrendingUp,
  Search,
  X,
  RefreshCw,
  User,
  Award,
  Eye,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  onShowAuth?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onExport: _onExport,
  onImport: _onImport,
  onClear: _onClear,
  onRefreshRecommendations,
  clearLoading: _clearLoading = false,
  recommendationsLoading = false,
  ratingsCount,
  watchlistCount,
  learningPhase,
  hasEnoughRatingsForAI,
  showingCuratedMovies,
  isMobile,
  isOpen,
  onToggle,
  onShowAuth
}) => {
  const { user, isAuthenticated, logout } = useAuth();
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
      id: 'featured-lists',
      label: 'Öne Çıkan Listeler',
      icon: Award,
      description: 'Prestijli sinema listeleri',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30'
    },
  ];

  // Quick actions - removed unused variable warning

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
              <Icon className={`h-5 w-5 ${isDisabled ? 'opacity-50' : ''}`} />
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
          <button
            onClick={() => {
              onTabChange('settings');
              // Mobil ekranlarda sayfa seçildikten sonra sidebar'ı kapat
              if (isMobile && isOpen) {
                onToggle();
              }
            }}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-theme-secondary hover:bg-theme-secondary hover:text-amber-300"
          >
            <Settings className="h-4 w-4" />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="px-2 py-3 border-t border-theme-primary">
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-theme-secondary rounded-lg p-2">
              <User className="h-4 w-4 text-theme-secondary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-theme-primary truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-theme-tertiary truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-2 rounded-lg text-xs font-medium transition-all hover:shadow-lg"
          >
            <LogIn className="h-3 w-3" />
            <span>Giriş Yap</span>
          </button>
        )}
        <p className="text-xs text-theme-tertiary text-center mt-2">AI Destekli Öneri Sistemi</p>
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