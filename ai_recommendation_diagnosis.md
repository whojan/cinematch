# AI Öneri Sistemi Tanı Raporu

## Sorun Analizi

Kullanıcı 585 içerik puanlamış olmasına rağmen AI önerileri alamıyor. Sorunun kökü, sistemin "geçerli puanlama" tanımında yatıyor.

## Geçerli Puanlama Kriterleri

Kod analizi sonucunda (`src/App.tsx` line 73):

```typescript
const validRatings = (ratings || []).filter(r => r.rating !== 'not_watched');
const validRatingCount = validRatings.filter(r => typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 10).length;
const hasEnoughRatingsForAI = validRatingCount >= 10;
```

AI önerileri için gerekli koşullar:

1. **Minimum 10 adet geçerli puanlama** gerekli
2. **Geçerli puanlama kriterleri:**
   - Numerik değer olmalı (1-10 arası sayı)
   - `'not_watched'` olmamalı
   - `'not_interested'` olmamalı  
   - `'skip'` olmamalı

## Muhtemel Sebepler

585 puanlanmış içerik olmasına rağmen AI önerileri gelmiyorsa:

### 1. Çoğu Rating Geçerli Değil
- Çoğu içerik `'not_watched'` olarak işaretlenmiş
- Çoğu içerik `'not_interested'` olarak işaretlenmiş
- Çoğu içerik `'skip'` olarak işaretlenmiş

### 2. Profile Oluşturulmamış
- `refreshRecommendations` fonksiyonu `profile` gerektirir
- Profile oluşması için minimum 10 geçerli puanlama gerekli

### 3. Filtreleme Problemleri
Recommendation Service'de katı filtreler var:

```typescript
// Rating filter (line ~140)
filteredRecommendations = filteredRecommendations.filter(rec => {
  return rec.movie.vote_average >= Math.max(8.0, filters.minRating) && 
         rec.movie.vote_average <= filters.maxRating &&
         rec.movie.vote_count >= 200;
});
```

**Kritik**: Sistem otomatik olarak minimum 8.0 TMDB puanı gerektiriyor!

## Çözüm Önerileri

### 1. Acil Çözüm - Filtreleri Gevşet
`src/features/recommendation/services/recommendationService.ts` dosyasında ~140. satırda:

```typescript
// MEVCUT:
return rec.movie.vote_average >= Math.max(8.0, filters.minRating) && 

// ÇÖZÜİM:
return rec.movie.vote_average >= Math.max(6.0, filters.minRating) && 
```

### 2. Orta Vadeli Çözüm - Akıllı Filtre
```typescript
// Kullanıcının ortalama puanına göre dinamik eşik
const userAvgRating = profile.averageRating || 6.0;
const minThreshold = Math.max(5.0, Math.min(8.0, userAvgRating - 1.0));
return rec.movie.vote_average >= Math.max(minThreshold, filters.minRating) &&
```

### 3. Uzun Vadeli Çözüm - Debug Dashboard
Kullanıcıların kendi istatistiklerini görebileceği bir panel:

- Toplam puanlama: 585
- Geçerli puanlama: X/10
- Engelleyici faktörler
- Hangi filtrelerin etkili olduğu

### 4. Minimum İçerik Garantisi
Eğer filtreleme sonrası hiç öneri kalmıyorsa, kriterleri otomatik gevşetme:

```typescript
if (filteredRecommendations.length === 0) {
  // Daha gevşek kriterlerle tekrar dene
  // Min rating'i düşür, vote_count'u azalt
}
```

## Hemen Test Edilebilir Çözüm

Kullanıcının durumunu test etmek için:

1. Browser console'da çalıştırılabilir kod:
```javascript
const ratings = JSON.parse(localStorage.getItem('cinematch_ratings') || '[]');
const validRatings = ratings.filter(r => r.rating !== 'not_watched');
const numericRatings = validRatings.filter(r => typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 10);

console.log('Toplam puanlama:', ratings.length);
console.log('Not watched filtresi sonrası:', validRatings.length);
console.log('Numerik puanlama (1-10):', numericRatings.length);
console.log('AI için yeterli mi?', numericRatings.length >= 10);
```

2. Eğer numerik puanlama 10'dan azsa, kullanıcı daha fazla 1-10 arası puanlama yapmalı
3. Eğer numerik puanlama 10'dan fazlaysa, filtre problemi var - kod değişikliği gerekli

## Yapılan Değişiklikler ✅

### 1. Ana Rating Filtresi Düzeltildi
**Dosya**: `src/features/recommendation/services/recommendationService.ts` (~140. satır)
```typescript
// ÖNCESİ: 
return rec.movie.vote_average >= Math.max(8.0, filters.minRating) && 
       rec.movie.vote_count >= 200;

// SONRASI:
return rec.movie.vote_average >= Math.max(6.0, filters.minRating) && 
       rec.movie.vote_count >= 100;
```

### 2. Oyuncu Bazlı Öneriler Düzeltildi
**Dosya**: `src/features/recommendation/services/recommendationService.ts` (~683. satır)
```typescript
// ÖNCESİ: 
.filter((movie: any) => movie.vote_average >= 8.0 && movie.vote_count >= 200)

// SONRASI:
.filter((movie: any) => movie.vote_average >= 6.0 && movie.vote_count >= 100)
```

### 3. Tür-Spesifik Öneriler Düzeltildi
**Dosya**: `src/features/recommendation/services/recommendationService.ts` (~350-380. satır)
```typescript
// ÖNCESİ: 
'vote_average.gte': 8.0,
'vote_count.gte': 200,

// SONRASI:
'vote_average.gte': 6.0,
'vote_count.gte': 100,
```

### 4. Çeşitlilik Önerileri Düzeltildi
**Dosya**: `src/features/recommendation/services/recommendationService.ts` (~480-520. satır)
```typescript
// ÖNCESİ: 
'vote_average.gte': 8.0,
'vote_count.gte': 200,

// SONRASI:
'vote_average.gte': 6.0,
'vote_count.gte': 100,
```

## Test Araçları

### 1. Tanı Scripti
**Dosya**: `rating_diagnosis_script.js`
- Browser console'da çalıştırılabilir
- Gerçek puanlama durumunu analiz eder
- Sorun kaynağını tespit eder

### 2. Hızlı Çözüm
Eğer filtrelerde sorun varsa:
```javascript
localStorage.removeItem('cinematch_recommendation_filters');
window.location.reload();
```

## Beklenen Sonuç

Bu değişikliklerden sonra:
- 6.0+ TMDB puanına sahip içerikler önerilecek (önceden 8.0+)
- 100+ oy alan içerikler dahil edilecek (önceden 200+)
- Çok daha fazla öneri seçeneği olacak
- 585 puanlamanız varsa AI önerileri muhtemelen çalışacak

## Öncelik Sırası

1. ✅ **TAMAMLANDI**: Rating filtrelerini 8.0'dan 6.0'a indirmek
2. ✅ **TAMAMLANDI**: Vote count filtrelerini 200'den 100'e indirmek
3. ✅ **TAMAMLANDI**: Kullanıcı tanı scripti eklemek  
4. **Gelecek**: Adaptif filtre sistemi geliştirmek