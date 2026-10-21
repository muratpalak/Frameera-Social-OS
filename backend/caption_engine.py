import re
import unicodedata
from schemas import CaptionIn

TONE_OPENERS = {
  "tr": {
    "professional": ["Yeni bir bakış açısı:", "Detaylarda fark yaratıyoruz.", "İyi fikirler, güçlü sonuçlar."],
    "friendly": ["Bunu sizinle paylaşmak için sabırsızlanıyorduk! ✨", "Bugün sizin için güzel bir fikrimiz var 💛", "Birlikte keşfetmeye ne dersiniz?"],
    "luxury": ["Zarafetin yeni yorumu.", "Her detay özenle tasarlandı.", "Sade. Özgün. Unutulmaz."],
    "playful": ["Dur, buna bayılacaksın! 🚀", "Bugün ilhamı yükseltiyoruz 🎬", "Hazır mısın? İşte yeni favorin! 🔥"]
  },
  "de": {
    "professional": ["Eine neue Perspektive:", "Der Unterschied liegt im Detail.", "Gute Ideen. Starke Ergebnisse."],
    "friendly": ["Das möchten wir mit euch teilen! ✨", "Heute haben wir etwas Besonderes für euch 💛", "Lust auf eine neue Entdeckung?"],
    "luxury": ["Eleganz, neu interpretiert.", "Jedes Detail ist bewusst gestaltet.", "Klar. Besonders. Unvergesslich."],
    "playful": ["Stopp, das musst du sehen! 🚀", "Heute wird es kreativ 🎬", "Bereit für dein neues Highlight? 🔥"]
  },
  "en": {
    "professional": ["A fresh perspective:", "Excellence is in the details.", "Good ideas. Meaningful results."],
    "friendly": ["We've been excited to share this with you! ✨", "Something lovely for you today 💛", "Come discover something new with us!"],
    "luxury": ["Elegance, reimagined.", "Considered in every detail.", "Simple. Distinctive. Timeless."],
    "playful": ["Stop scrolling — you'll love this! 🚀", "A little creative magic today 🎬", "Ready for your next obsession? 🔥"]
  }
}
FRAME = {
 "tr": ["{topic} üzerine hazırladığımız bu çalışmanın arkasındaki hikâyeyi keşfedin.",
        "{topic} hakkında bilmeniz gerekenleri kısa ve etkili bir şekilde bir araya getirdik.",
        "{topic}: bizim için sadece bir konu değil, paylaşmaya değer bir deneyim."],
 "de": ["Entdeckt die Geschichte hinter unserem Beitrag zu {topic}.",
        "Wir haben das Wichtigste rund um {topic} kompakt für euch zusammengestellt.",
        "{topic}: für uns mehr als ein Thema – eine Geschichte, die wir teilen möchten."],
 "en": ["Discover the story behind our latest take on {topic}.",
        "Here's a fresh, thoughtful look at everything that makes {topic} special.",
        "{topic}: more than a topic, it's a story worth sharing."]
}
CTA = {"tr":"Daha fazlası için bizi takip edin.","de":"Folgt uns für weitere Einblicke.","en":"Follow for more inspiration."}
PLATFORM_HINT = {
 "tr":{"instagram":"Kaydet ve ilham almak isteyen biriyle paylaş.","tiktok":"Sonuna kadar izle ve yorumunu bırak.","youtube":"Yorumlarda senin fikrini de duymak isteriz.","linkedin":"Siz bu konuda ne düşünüyorsunuz?"},
 "de":{"instagram":"Speichern und mit Freunden teilen.","tiktok":"Bis zum Ende ansehen und kommentieren.","youtube":"Schreibt uns eure Meinung in die Kommentare.","linkedin":"Wie seht ihr das?"},
 "en":{"instagram":"Save this and share it with someone who needs it.","tiktok":"Watch until the end and drop a comment.","youtube":"Tell us what you think in the comments.","linkedin":"What's your perspective?"}
}

def to_hashtag(topic: str) -> str:
    raw = unicodedata.normalize("NFKD", topic.replace("ı", "i").replace("İ", "I"))
    raw = "".join(c for c in raw if not unicodedata.combining(c))
    tokens = re.findall(r"[A-Za-z0-9]+", raw)
    return "".join(t.capitalize() for t in tokens[:3])[:28] or "Content"

def generate_captions(payload: CaptionIn):
    lang = payload.language
    topic = payload.topic.strip()
    topic_title = topic[0].upper()+topic[1:]
    hashtag = "#"+to_hashtag(topic)
    extras={"instagram":"#Reels #CreativeStudio","tiktok":"#ForYou #Creative","youtube":"#YouTube #NewVideo","linkedin":"#Insights #Business"}[payload.platform]
    result=[]
    for i, opener in enumerate(TONE_OPENERS[lang][payload.tone]):
        title=[topic_title, f"{topic_title} ✨",f"{topic_title} | 03"][i]
        caption=f"{opener}\n\n{FRAME[lang][i].format(topic=topic)}\n\n{PLATFORM_HINT[lang][payload.platform]}\n{payload.call_to_action.strip() or CTA[lang]}\n\n{hashtag} {extras}"
        result.append({"title": title[:180], "caption": caption, "hashtags": f"{hashtag} {extras}"})
    return {"method":"template", "variants":result}
