# ✦ Frameera Social OS — Türkçe Kurulum

**Birden fazla müşterinin Instagram, TikTok, YouTube ve LinkedIn içeriklerini tek panelden yönetmek için hazırlanan çalışan yerel yazılım prototipi.**

## Mac'te çalıştırma

1. `Frameera-Social-OS.zip` dosyasını aç.
2. **`START-MAC.command`** dosyasına çift tıkla. macOS güvenlik uyarısı gösterirse Terminal'de klasörü açıp `bash START-MAC.command` çalıştır.
3. Gerekli yazılımlar **Node.js 20+** (https://nodejs.org) ve **Python 3.10+** (https://python.org). İlk kurulumda npm ve pip internet bağlantısıyla bağımlılıkları indirir.
4. Panel tarayıcıda **http://127.0.0.1:5173** adresinde açılır. Terminal penceresi açık kalmalı.
5. API belgeleri: **http://127.0.0.1:8000/docs**.

## Özellikler

- **Müşteriler:** Marka renkleri, sektör, marka dili, sosyal medya kullanıcı adları; müşteri ekleme/düzenleme/silme.
- **İçerikler:** Platform, tür (Reels, post, story, video, carousel), metin, müşteri, medya, taslak/planlandı/yayınlandı durumları.
- **Takvim:** Haftalık plan, tarihler arasında sürükle-bırak, taslağa geri taşıma, içerik kartına tıklayıp düzenleme.
- **Medya:** Fotoğraf/video yükleme, müşteri filtresi, önizleme, silme. En fazla 100 MB/dosya.
- **Analitik:** 7/30/90 günlük grafikler, platform kırılımları, müşteri bazlı filtre, elle ölçüm girişi ve Excel uyumlu CSV raporu dışa aktarma.
- **Caption Studio:** 3 alternatif başlık/açıklama, TR/DE/EN, 4 farklı ton ve platforma özgü format.
- **Arayüz:** Apple esintili Glass UI, modern koyu/açık tema ve Türkçe/Almanca/İngilizce.

### Çok önemli: v1 kapsamı

- **Otomatik sosyal medya paylaşımı yapmaz.** Paylaşım takvimi, içerik üretimi ve yayın statüsü elle yönetilir.
- **Gerçek sosyal medya hesaplarına bağlanmaz.** Canlı takipçi/gösterim istatistiklerini çekmez.
- İlk açılışta grafiklerin boş olmaması için **DEMO verileri** yüklenir. Bunlar gerçek müşteri performansı değildir. Gerçek ölçümleri Analitik > Veri girişi bölümünden ekleyebilirsin.
- Üretilen açıklamalar **AI değil, şablon tabanlıdır**; harici API anahtarı gerektirmez.
- **Yerel kullanım amaçlıdır; giriş/şifre yönetimi yoktur.** İnternete açık sunucuya koymadan önce hesap yetkilendirme, güvenlik ve veri izolasyonu eklenmelidir.

## Veriler nerede saklanır?

`backend/data/socialos.sqlite3` veritabanı ve `backend/data/uploads/` medya klasörü. Bunları yedeklersen müşteri çalışmaların korunur. GitHub'a **bu klasörleri yükleme**; `.gitignore` zaten engeller.

## GitHub'a yükleme

GitHub'da `Frameera-Social-OS` isimli boş depo oluştur. Mac için `GITHUB-YUKLE.command` dosyasını çalıştırabilir veya ZIP içindeki klasörü Terminal'de açıp aşağıdaki komutları kullanabilirsin:

```bash
git init
git branch -M main
git add .
git commit -m "Initial release - Frameera Social OS v1.0"
git remote add origin https://github.com/muratpalak/Frameera-Social-OS.git
git push -u origin main
```

**Not:** Uzak depo sen oluşturmadıysan `git push` çalışmaz. GitHub bağlantısı örnek hedeftir, oluşturulmuş bir depoyu doğrulamaz.

## Teknik altyapı

React 18 · TypeScript · Vite · Recharts · Lucide · Python/FastAPI · SQLAlchemy · SQLite.

Detaylı teknik belge: `docs/ARCHITECTURE.md`. İngilizce kurulum: `README.md`.
