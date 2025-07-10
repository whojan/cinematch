## 🎨 CineMatch AI UI/UX Revizyon Planı

### 1. 🎯 Hedefler

* Sayfalar arası **renk uyumu** ve marka bütünlüğü sağlamak
* Tüm sayfalarda **ortak layout yapısı** ve tutarlı navigasyon
* Daha modern, sade ve erişilebilir bir kullanıcı deneyimi

---

### 2. 🎨 Renk Paleti Standardizasyonu

#### 🎨 Yeni Önerilen Tema (Dark / Soft Gradient Style)

| Element        | Renk Kodu | Notlar                       |
| -------------- | --------- | ---------------------------- |
| Arka Plan      | `#121212` | Soft dark, göz yormayan      |
| Ana Renk       | `#FF4C29` | Markanın öne çıkan rengi     |
| İkincil Renk   | `#FFD369` | Hover/Accent için kullanılır |
| Yazı (light)   | `#FFFFFF` | Başlık ve ana yazı rengi     |
| Yazı (subtle)  | `#B0B0B0` | Açıklamalar, alt metinler    |
| Kart Arkaplanı | `#1F1F1F` | Film kartları / bileşenler   |

---

### 3. 🧱 Ortak Sayfa Yapısı (Layout)

#### ✅ Yeni Layout Tasarımı (Tüm Sayfalar İçin Ortak)

* **Header**: Logo + Navigasyon + Kullanıcı butonu (profil simgesi vs.)
* **Main**: İçerik kartları, liste ya da detaylar
* **Sidebar (isteğe bağlı)**: Filtreler, öneri ayarları
* **Footer**: Hakkında, Gizlilik, SSS, Sosyal medya ikonları

> Bu yapının `AppLayout.tsx` gibi tek bir `layout component` içinde tanımlanması önerilir.

```tsx
// src/layout/AppLayout.tsx
export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-[#121212] text-white">
    <Header />
    <main className="px-4 py-6">{children}</main>
    <Footer />
  </div>
);
```

---

### 4. 🧩 Sayfa Bileşenlerinin Tutarlılığı

#### 🎬 Film Kartı Standardı

* Sabit oran: **16:9** poster
* Hover'da: açıklama, puan, favoriye ekle
* Butonlar: ortak `Button` component (örneğin `shadcn/ui` veya `tailwind variant`)

```tsx
// src/components/MovieCard.tsx
export const MovieCard = ({ movie }) => (
  <div className="bg-[#1f1f1f] rounded-2xl overflow-hidden shadow hover:scale-105 transition">
    <img src={movie.poster} alt={movie.title} className="w-full aspect-[16/9] object-cover" />
    <div className="p-4">
      <h3 className="text-lg font-semibold">{movie.title}</h3>
      <p className="text-sm text-[#b0b0b0]">{movie.releaseDate}</p>
    </div>
  </div>
);
```

---

### 5. 📱 Mobil Uyumluluk (Responsive Design)

* `Tailwind` ile tüm grid sisteminin **mobil öncelikli** olması sağlanmalı
* Menü hamburger'e dönüşmeli
* Kartlar `1 kolon` -> `2 kolon` -> `4 kolon` şeklinde esnek olmalı

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
</div>
```

---

### 6. 🧪 Kullanıcı Testi ve Geri Bildirim

* Yeni tasarımlar önce `Preview Environment`'ta test edilir (Vercel, Netlify)
* 5–10 kullanıcıya A/B testi ile eski ve yeni sürüm karşılaştırılır
* `Hotjar` veya `PostHog` ile kullanıcı davranışı izlenebilir

---

## 📦 Sonuç

Bu düzenlemeyle:

* Görsel tutarlılık artar
* Kullanıcı deneyimi profesyonelleşir
* Marka kimliği netleşir
* Mobil kullanılabilirlik gelişir
