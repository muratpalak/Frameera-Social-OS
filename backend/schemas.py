from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator

Platform = Literal["instagram", "tiktok", "youtube", "linkedin"]
Status = Literal["draft", "scheduled", "published"]
Kind = Literal["post", "reel", "story", "video", "carousel"]

class ClientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    industry: str = Field(default="", max_length=100)
    color: str = Field(default="#7C8CFF", pattern=r"^#[0-9a-fA-F]{6}$")
    brand_voice: str = Field(default="professional", max_length=100)
    accounts: dict[str, str] = Field(default_factory=dict)

class ClientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    industry: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    brand_voice: str | None = Field(default=None, max_length=100)
    accounts: dict[str, str] | None = None

class ClientOut(ClientCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class PostBase(BaseModel):
    client_id: int
    platform: Platform
    title: str = Field(min_length=1, max_length=220)
    caption: str = Field(default="", max_length=10000)
    content_type: Kind = "post"
    status: Status = "draft"
    scheduled_at: datetime | None = None
    asset_id: int | None = None

    @model_validator(mode="after")
    def scheduled_must_have_date(self):
        if self.status == "scheduled" and self.scheduled_at is None:
            raise ValueError("Scheduled posts need a date")
        return self

class PostCreate(PostBase):
    pass

class PostPatch(BaseModel):
    client_id: int | None = None
    platform: Platform | None = None
    title: str | None = Field(default=None, min_length=1, max_length=220)
    caption: str | None = Field(default=None, max_length=10000)
    content_type: Kind | None = None
    status: Status | None = None
    scheduled_at: datetime | None = None
    asset_id: int | None = None

class PostOut(PostBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class AssetOut(BaseModel):
    id: int
    client_id: int
    filename: str
    mime_type: str
    size_bytes: int
    url: str
    created_at: datetime

class MetricIn(BaseModel):
    client_id: int
    platform: Platform
    day: date
    impressions: int = Field(ge=0, le=1000000000)
    reach: int = Field(ge=0, le=1000000000)
    engagements: int = Field(ge=0, le=1000000000)
    views: int = Field(ge=0, le=1000000000)
    followers_gained: int = Field(ge=0, le=1000000000)

class CaptionIn(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    platform: Platform
    tone: Literal["professional", "friendly", "luxury", "playful"] = "professional"
    language: Literal["tr", "de", "en"] = "tr"
    call_to_action: str = Field(default="", max_length=180)
