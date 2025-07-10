import { GuideStep, GuideCategory } from '../types/guide';

export const guideCategories: GuideCategory[] = [
  {
    id: 'navigation',
    name: 'Navigasyon',
    description: 'Uygulamada nasıl dolaşacağını öğren',
    icon: 'compass',
    color: 'from-blue-500 to-indigo-500',
    order: 1
  },
  {
    id: 'discovery',
    name: 'İçerik Keşfi',
    description: 'Yeni film ve dizileri nasıl keşfedeceğini öğren',
    icon: 'search',
    color: 'from-purple-500 to-pink-500',
    order: 2
  },
  {
    id: 'rating',
    name: 'Puanlama Sistemi',
    description: 'İçerikleri nasıl puanlayacağını ve sistemi nasıl geliştireceğini öğren',
    icon: 'star',
    color: 'from-amber-500 to-orange-500',
    order: 3
  },
  {
    id: 'recommendations',
    name: 'AI Önerileri',
    description: 'Kişiselleştirilmiş önerileri nasıl alacağını öğren',
    icon: 'brain',
    color: 'from-green-500 to-emerald-500',
    order: 4
  },
  {
    id: 'profile',
    name: 'Profil Yönetimi',
    description: 'Profilini nasıl yöneteceğini ve verilerini nasıl kullanacağını öğren',
    icon: 'user',
    color: 'from-cyan-500 to-blue-500',
    order: 5
  },
  {
    id: 'advanced',
    name: 'Gelişmiş Özellikler',
    description: 'Profesyonel özellikleri ve ipuçlarını keşfet',
    icon: 'settings',
    color: 'from-violet-500 to-purple-500',
    order: 6
  }
];

export const guideSteps: GuideStep[] = [
  // Navigation Category
  {
    id: 'nav-sidebar',
    title: 'Ana Navigasyon',
    description: 'Sol menü ile uygulamanın tüm bölümlerine kolayca ulaşabilirsin. Her simgenin üzerine geldiğinde ne yaptığını görebilirsin.',
    targetSelector: '[data-guide="sidebar"]',
    position: 'right',
    highlightType: 'border',
    icon: 'compass',
    actionType: 'hover',
    actionText: 'Menü öğelerinin üzerine gel',
    category: guideCategories[0],
    showOnce: true
  },
  {
    id: 'nav-search',
    title: 'Akıllı Arama',
    description: 'Arama çubuğu ile film, dizi veya oyuncu arayabilirsin. Yazarken otomatik öneriler göreceksin ve Enter\'a basarak arama yapabilirsin.',
    targetSelector: '[data-guide="search-input"]',
    position: 'bottom',
    highlightType: 'spotlight',
    icon: 'search',
    actionType: 'click',
    actionText: 'Arama çubuğuna tıkla ve bir şeyler yaz',
    category: guideCategories[0]
  },
  {
    id: 'nav-tabs',
    title: 'Bölümler Arası Geçiş',
    description: 'Keşfet, AI Önerileri, Profil ve Ayarlar bölümleri arasında kolayca geçiş yapabilirsin.',
    targetSelector: '[data-guide="tab-navigation"]',
    position: 'bottom',
    highlightType: 'glow',
    icon: 'layers',
    category: guideCategories[0]
  },

  // Discovery Category
  {
    id: 'discovery-content',
    title: 'İçerik Keşfi',
    description: 'Bu bölümde sana özel seçilmiş film ve dizileri bulabilirsin. Her içeriği puanlayarak sistemin seni daha iyi tanımasını sağlayabilirsin.',
    targetSelector: '[data-guide="discovery-content"]',
    position: 'top',
    highlightType: 'pulse',
    icon: 'discover',
    category: guideCategories[1]
  },
  {
    id: 'discovery-filters',
    title: 'İçerik Filtreleri',
    description: 'Tür, yıl, puan gibi filtreler ile aradığın içeriği daha kolay bulabilirsin. Filtreler gerçek zamanlı olarak uygulanır.',
    targetSelector: '[data-guide="content-filters"]',
    position: 'left',
    highlightType: 'border',
    icon: 'filter',
    category: guideCategories[1],
    optional: true
  },
  {
    id: 'discovery-curated',
    title: 'Özel Koleksiyonlar',
    description: 'BFI En İyi Filmler, Yönetmen Seçkileri gibi küratörlük koleksiyonları ile kaliteli içerikleri keşfedebilirsin.',
    targetSelector: '[data-guide="curated-collections"]',
    position: 'top',
    highlightType: 'glow',
    icon: 'collection',
    category: guideCategories[1],
    optional: true
  },

  // Rating Category
  {
    id: 'rating-system',
    title: 'Puanlama Sistemi',
    description: 'İçerikleri 1-10 arası puanlayabilir, \'İzlemedim\' veya \'İlgimi Çekmiyor\' seçeneklerini kullanabilirsin. Bu puanlar AI\'nin seni öğrenmesine yardımcı olur.',
    targetSelector: '[data-guide="rating-controls"]',
    position: 'bottom',
    highlightType: 'spotlight',
    icon: 'star',
    actionType: 'click',
    actionText: 'Bir içeriği puanla',
    category: guideCategories[2]
  },
  {
    id: 'rating-quick',
    title: 'Hızlı Puanlama',
    description: 'Klavye kısayolları ile daha hızlı puanlama yapabilirsin: 1-9 tuşları (puanlar), S (atla), N (ilgimi çekmiyor), W (izleme listesi)',
    targetSelector: '[data-guide="movie-card"]',
    position: 'top',
    highlightType: 'pulse',
    icon: 'keyboard',
    category: guideCategories[2],
    optional: true
  },
  {
    id: 'rating-impact',
    title: 'Puanlama Etkisi',
    description: 'Her puanlama sonrası öğrenme barın ilerleyecek ve sistem seni daha iyi tanıyacak. Dürüst puanlama yapmak önemli!',
    targetSelector: '[data-guide="learning-progress"]',
    position: 'bottom',
    highlightType: 'glow',
    icon: 'trending-up',
    category: guideCategories[2]
  },

  // Recommendations Category
  {
    id: 'recommendations-ai',
    title: 'AI Önerileri',
    description: 'Yeterli puanlama yaptıktan sonra burada sana özel AI önerilerini görebilirsin. Bu öneriler sürekli gelişir.',
    targetSelector: '[data-guide="ai-recommendations"]',
    position: 'top',
    highlightType: 'spotlight',
    icon: 'brain',
    category: guideCategories[3],
    prerequisite: ['rating-system']
  },
  {
    id: 'recommendations-filters',
    title: 'Öneri Filtreleri',
    description: 'Önerilerini tür, yıl, puan aralığı gibi kriterlerle filtreleyebilir ve kendi zevkine göre özelleştirebilirsin.',
    targetSelector: '[data-guide="recommendation-filters"]',
    position: 'left',
    highlightType: 'border',
    icon: 'sliders',
    category: guideCategories[3],
    optional: true
  },
  {
    id: 'recommendations-refresh',
    title: 'Öneri Yenileme',
    description: 'Önerilerini beğenmediysen \'Yenile\' butonuyla yeni öneriler alabilirsin. Her yenileme farklı algoritmalar kullanır.',
    targetSelector: '[data-guide="refresh-recommendations"]',
    position: 'bottom',
    highlightType: 'pulse',
    icon: 'refresh',
    category: guideCategories[3]
  },

  // Profile Category
  {
    id: 'profile-overview',
    title: 'Profil Görünümü',
    description: 'Burada puanlama istatistiklerin, tür tercihler ve öğrenme ilerlemeyi görebilirsin.',
    targetSelector: '[data-guide="profile-section"]',
    position: 'top',
    highlightType: 'border',
    icon: 'user',
    category: guideCategories[4]
  },
  {
    id: 'profile-watchlist',
    title: 'İzleme Listesi',
    description: 'Daha sonra izlemek istediğin içerikleri buraya ekleyebilir ve organize edebilirsin.',
    targetSelector: '[data-guide="watchlist-button"]',
    position: 'bottom',
    highlightType: 'glow',
    icon: 'bookmark',
    actionType: 'click',
    actionText: 'İzleme listeni aç',
    category: guideCategories[4]
  },
  {
    id: 'profile-export',
    title: 'Veri Yönetimi',
    description: 'Verilerini dışa aktarabilir, yedekleyebilir ve başka bir cihaza aktarabilirsin. Bu özellik sidebar\'da bulunur.',
    targetSelector: '[data-guide="export-data"]',
    position: 'right',
    highlightType: 'spotlight',
    icon: 'download',
    category: guideCategories[4],
    optional: true
  },

  // Advanced Category
  {
    id: 'advanced-settings',
    title: 'Gelişmiş Ayarlar',
    description: 'Ayarlar bölümünde öneri sayısı, tema, dil ve diğer kişiselleştirme seçeneklerini bulabilirsin.',
    targetSelector: '[data-guide="settings-section"]',
    position: 'center',
    highlightType: 'border',
    icon: 'settings',
    category: guideCategories[5],
    optional: true
  },
  {
    id: 'advanced-shortcuts',
    title: 'Klavye Kısayolları',
    description: 'Klavye kısayollarını öğrenerek daha hızlı kullanım sağlayabilirsin. Tam liste için ? tuşuna bas.',
    targetSelector: '[data-guide="shortcuts-help"]',
    position: 'bottom',
    highlightType: 'pulse',
    icon: 'keyboard',
    category: guideCategories[5],
    optional: true
  },
  {
    id: 'advanced-algorithms',
    title: 'Öneri Algoritmaları',
    description: 'Sistem hibrit öneri algoritması kullanır: içerik bazlı + işbirlikçi filtreleme + yapay zeka. Her aşamada farklı stratejiler devreye girer.',
    targetSelector: '[data-guide="algorithm-info"]',
    position: 'center',
    highlightType: 'glow',
    icon: 'cpu',
    category: guideCategories[5],
    optional: true
  }
];

export const contextualHints = [
  {
    id: 'hint-first-rating',
    text: 'İlk puanını verdin! Her puanlama sistemin seni daha iyi tanımasına yardımcı olur.',
    icon: 'star',
    targetSelector: '[data-guide="rating-controls"]',
    condition: () => {
      const ratings = JSON.parse(localStorage.getItem('cinematch_ratings') || '[]');
      return ratings.length === 1;
    },
    frequency: 'once' as const,
    priority: 1
  },
  {
    id: 'hint-watchlist-full',
    text: 'İzleme listen dolmaya başladı! İzledikçe puanlamayı unutma.',
    icon: 'bookmark',
    targetSelector: '[data-guide="watchlist-button"]',
    condition: () => {
      const watchlist = JSON.parse(localStorage.getItem('cinematch_watchlist') || '[]');
      return watchlist.length >= 10;
    },
    frequency: 'once' as const,
    priority: 2
  },
  {
    id: 'hint-ai-ready',
    text: 'Harika! Artık AI önerilerine geçebilirsin. Önerilerin hazır!',
    icon: 'brain',
    targetSelector: '[data-guide="tab-navigation"]',
    condition: () => {
      const ratings = JSON.parse(localStorage.getItem('cinematch_ratings') || '[]');
      return ratings.filter((r: any) => typeof r.rating === 'number').length >= 10;
    },
    frequency: 'once' as const,
    priority: 3
  }
];