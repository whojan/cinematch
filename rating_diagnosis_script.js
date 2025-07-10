// AI Öneri Sistemi Tanı Scripti
// Bu kodu browser console'da çalıştırın

console.log("🔍 CineMatch AI Öneri Sistemi Tanısı Başlıyor...\n");

try {
  // Ratings verilerini localStorage'dan al
  const ratingsData = localStorage.getItem('cinematch_ratings');
  const profileData = localStorage.getItem('cinematch_profile');
  
  if (!ratingsData) {
    console.log("❌ Hiç puanlama verisi bulunamadı!");
    console.log("Çözüm: En az 10 içerik puanlamanız gerekiyor.");
    throw new Error("No ratings found");
  }

  const ratings = JSON.parse(ratingsData);
  const profile = profileData ? JSON.parse(profileData) : null;

  console.log("📊 PUANLAMA ANALİZİ:");
  console.log("==================");
  console.log(`📝 Toplam puanlama: ${ratings.length}`);

  // İlk filtreleme: 'not_watched' olanları çıkar
  const validRatings = ratings.filter(r => r.rating !== 'not_watched');
  console.log(`✅ 'Not watched' filtresi sonrası: ${validRatings.length}`);

  // İkinci filtreleme: Numerik puanlamaları (1-10) bul
  const numericRatings = validRatings.filter(r => 
    typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 10
  );
  console.log(`🔢 Numerik puanlama (1-10): ${numericRatings.length}`);

  // Diğer puanlama türlerini kategorize et
  const notWatchedCount = ratings.filter(r => r.rating === 'not_watched').length;
  const notInterestedCount = ratings.filter(r => r.rating === 'not_interested').length;
  const skipCount = ratings.filter(r => r.rating === 'skip').length;
  const invalidCount = ratings.filter(r => 
    typeof r.rating !== 'number' && 
    !['not_watched', 'not_interested', 'skip'].includes(r.rating)
  ).length;

  console.log(`\n📋 PUANLAMA TÜRLERİ DAĞILIMI:`);
  console.log(`- Numerik (1-10): ${numericRatings.length}`);
  console.log(`- Not watched: ${notWatchedCount}`);
  console.log(`- Not interested: ${notInterestedCount}`);
  console.log(`- Skip: ${skipCount}`);
  console.log(`- Geçersiz: ${invalidCount}`);

  // AI öneri kontrolü
  const hasEnoughForAI = numericRatings.length >= 10;
  console.log(`\n🤖 AI ÖNERİ DURUMU:`);
  console.log(`AI için yeterli puanlama: ${hasEnoughForAI ? '✅ EVET' : '❌ HAYIR'}`);
  console.log(`Gerekli: 10, Mevcut: ${numericRatings.length}`);

  if (!hasEnoughForAI) {
    console.log(`📌 ${10 - numericRatings.length} tane daha 1-10 arası puanlama yapmanız gerekiyor.`);
  }

  // Profile kontrolü
  console.log(`\n👤 PROFİL DURUMU:`);
  if (profile) {
    console.log(`✅ Profil mevcut`);
    console.log(`- Öğrenme aşaması: ${profile.learningPhase || 'Bilinmiyor'}`);
    console.log(`- Ortalama puan: ${profile.averageScore || 'Bilinmiyor'}`);
    console.log(`- Toplam puanlama: ${profile.totalRatings || 'Bilinmiyor'}`);
  } else {
    console.log(`❌ Profil bulunamadı`);
  }

  // Filterlar kontrolü
  const filtersData = localStorage.getItem('cinematch_recommendation_filters');
  if (filtersData) {
    const filters = JSON.parse(filtersData);
    console.log(`\n🔧 AKTİF FİLTRELER:`);
    console.log(`- Min rating: ${filters.minRating || 0}`);
    console.log(`- Max rating: ${filters.maxRating || 10}`);
    console.log(`- Min match score: ${filters.minMatchScore || 0}`);
    console.log(`- Media type: ${filters.mediaType || 'all'}`);
    console.log(`- Genres: ${filters.genres?.length || 0} tür seçili`);
    
    if (filters.minRating > 6) {
      console.log(`⚠️  Min rating çok yüksek (${filters.minRating}), önerileri engelleyebilir`);
    }
    if (filters.minMatchScore > 50) {
      console.log(`⚠️  Min match score çok yüksek (${filters.minMatchScore}), önerileri engelleyebilir`);
    }
  }

  // Çözüm önerileri
  console.log(`\n💡 ÇÖZÜM ÖNERİLERİ:`);
  console.log(`==================`);

  if (!hasEnoughForAI) {
    console.log(`1. 🎯 ${10 - numericRatings.length} tane daha içerik puanlayın (1-10 arası)`);
    console.log(`2. 🚫 "Not watched", "Not interested", "Skip" seçenekleri AI öğrenmesine katkı sağlamıyor`);
    console.log(`3. 🎬 Keşif İçerikleri veya Öneriler sekmesinden içerik puanlayın`);
  } else {
    console.log(`1. ✅ Yeterli puanlamanız var, "Yeni Öneriler Oluştur" butonunu deneyin`);
    console.log(`2. 🔧 Öneri filtrelerini kontrol edin (çok kısıtlayıcı olabilir)`);
    console.log(`3. 🔄 Sayfayı yenileyin veya verileri temizleyip tekrar başlayın`);
  }

  // Test kodu
  console.log(`\n🧪 HIZLI TEST KODU:`);
  console.log(`Aşağıdaki kodu çalıştırarak filtreleri sıfırlayabilirsiniz:`);
  console.log(`localStorage.removeItem('cinematch_recommendation_filters');`);
  console.log(`window.location.reload();`);

} catch (error) {
  console.error("❌ Tanı sırasında hata:", error);
}

console.log(`\n🎯 Tanı tamamlandı! Sorun devam ederse kod değişikliği gerekebilir.`);