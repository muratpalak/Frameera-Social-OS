from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, DateTime, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Client(Base):
    __tablename__ = "clients"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140), unique=True)
    industry: Mapped[str] = mapped_column(String(100), default="")
    color: Mapped[str] = mapped_column(String(24), default="#7C8CFF")
    brand_voice: Mapped[str] = mapped_column(String(100), default="professional")
    accounts: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    posts: Mapped[list["Post"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    metrics: Mapped[list["Metric"]] = relationship(back_populates="client", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    platform: Mapped[str] = mapped_column(String(24))
    title: Mapped[str] = mapped_column(String(220))
    caption: Mapped[str] = mapped_column(Text, default="")
    content_type: Mapped[str] = mapped_column(String(24), default="post")
    status: Mapped[str] = mapped_column(String(24), default="draft")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    asset_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    client: Mapped[Client] = relationship(back_populates="posts")

class Asset(Base):
    __tablename__ = "assets"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    mime_type: Mapped[str] = mapped_column(String(80))
    size_bytes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    client: Mapped[Client] = relationship(back_populates="assets")

class Metric(Base):
    __tablename__ = "metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    platform: Mapped[str] = mapped_column(String(24))
    day: Mapped[date] = mapped_column(Date, index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    reach: Mapped[int] = mapped_column(Integer, default=0)
    engagements: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    followers_gained: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    client: Mapped[Client] = relationship(back_populates="metrics")
