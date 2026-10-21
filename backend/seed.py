from datetime import date, datetime, timedelta
import random
from sqlalchemy.orm import Session
from models import Client, Post, Metric

SAMPLE_CLIENTS = [
    ("Frameera Studio", "Creative agency", "#8B8CFF", "luxury", {"instagram":"@frameerastudio","linkedin":"Frameera Studio"}),
    ("Lumi Baby Spa", "Wellness · Demo", "#F6A8B8", "friendly", {"instagram":"@lumi.demo", "tiktok":"@lumi.demo"}),
    ("Nord Atelier", "Art & design · Demo", "#78CDB5", "playful", {"instagram":"@nord.demo","youtube":"Nord Atelier"}),
]
PLATFORMS = ["instagram", "tiktok", "youtube", "linkedin"]
TITLES = ["Behind the scenes", "A new story begins", "Signature experience", "Creative moments", "Meet our vision", "Studio highlights", "Your next inspiration"]

def seed_demo(db: Session):
    if db.query(Client).first():
        return
    rng = random.Random(54)
    today = date.today()
    clients=[]
    for name, industry, color, voice, accounts in SAMPLE_CLIENTS:
        client = Client(name=name, industry=industry, color=color, brand_voice=voice, accounts=accounts)
        db.add(client)
        db.flush()
        clients.append(client)
        for days_back in range(44, -1, -1):
            day = today-timedelta(days=days_back)
            for p, platform in enumerate(PLATFORMS):
                factor = [1.3, .83, .75, .57][p]
                variation = 1 + .28 * __import__('math').sin((44-days_back)/5+p)
                impressions = int((400 + rng.randint(0,1100) + (44-days_back)*14)*factor*variation)
                db.add(Metric(client_id=client.id, platform=platform, day=day,
                              impressions=impressions, reach=int(impressions*.72),
                              engagements=int(impressions*(.045+rng.random()*.06)),
                              views=int(impressions*.84), followers_gained=rng.randint(0,12), is_demo=True))
        for idx in range(11):
            scheduled = datetime.combine(today + timedelta(days=idx-3), datetime.min.time()).replace(hour=[9,12,16,18][idx%4],minute=30)
            status = "published" if idx<3 else "scheduled" if idx<9 else "draft"
            db.add(Post(client_id=client.id, platform=PLATFORMS[(idx+client.id)%4],
                        title=TITLES[(idx+client.id)%len(TITLES)],
                        caption="A little creativity goes a long way. Discover our latest moment. ✨ #creative #studio",
                        content_type=["reel","post","carousel","video"][idx%4],
                        status=status,
                        scheduled_at=None if status=="draft" else scheduled))
    db.commit()
