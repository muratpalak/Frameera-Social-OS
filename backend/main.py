"""Frameera Social OS — local-first API. OAuth publishing is NOT implemented."""
from contextlib import asynccontextmanager
from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4
from io import StringIO
import csv

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import Base, engine, get_db
from models import Client, Post, Asset, Metric
from schemas import (ClientCreate, ClientUpdate, ClientOut, PostCreate, PostPatch,
                     PostOut, AssetOut, MetricIn, CaptionIn)
from seed import seed_demo
from caption_engine import generate_captions

BASE_DIR = Path(__file__).resolve().parent
MEDIA_DIR = BASE_DIR / "data" / "uploads"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE = 100 * 1024 * 1024
ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"}
EXTENSIONS = {"image/jpeg":{".jpg",".jpeg"},"image/png":{".png"},"image/webp":{".webp"},"image/gif":{".gif"},"video/mp4":{".mp4"},"video/quicktime":{".mov"},"video/webm":{".webm"}}

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with next_session() as db:
        seed_demo(db)
    yield

from contextlib import contextmanager
@contextmanager
def next_session():
    from database import SessionLocal
    db=SessionLocal()
    try:yield db
    finally:db.close()

app=FastAPI(title="Frameera Social OS API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:4173","http://127.0.0.1:4173"], allow_credentials=False, allow_methods=["GET","POST","PATCH","DELETE"],allow_headers=["Content-Type"])
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

def require_client(db:Session, client_id:int):
    obj=db.get(Client,client_id)
    if not obj: raise HTTPException(404,"Client not found")
    return obj

def validate_asset(db:Session, asset_id:int | None, client_id:int):
    if asset_id is not None:
        asset=db.get(Asset,asset_id)
        if not asset or asset.client_id!=client_id:
            raise HTTPException(422,"Asset must belong to the selected client")

def commit_or_conflict(db:Session):
    try:db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409,"A client with that name already exists")

@app.get("/api/health")
def health():return {"ok":True,"service":"frameera-social-os", "posting_integration":False}

@app.get("/api/clients",response_model=list[ClientOut])
def clients(db:Session=Depends(get_db)):
    return db.query(Client).order_by(Client.created_at).all()

@app.post("/api/clients",response_model=ClientOut,status_code=201)
def add_client(payload:ClientCreate,db:Session=Depends(get_db)):
    entry=Client(**payload.model_dump());db.add(entry);commit_or_conflict(db);db.refresh(entry);return entry

@app.patch("/api/clients/{id}",response_model=ClientOut)
def patch_client(id:int,payload:ClientUpdate,db:Session=Depends(get_db)):
    entry=require_client(db,id)
    for k,v in payload.model_dump(exclude_unset=True).items():setattr(entry,k,v)
    commit_or_conflict(db);db.refresh(entry);return entry

@app.delete("/api/clients/{id}",status_code=204)
def remove_client(id:int,db:Session=Depends(get_db)):
    entry=require_client(db,id)
    stored=[x.stored_name for x in entry.assets]
    db.delete(entry);db.commit()
    for filename in stored:(MEDIA_DIR/filename).unlink(missing_ok=True)

@app.get("/api/posts",response_model=list[PostOut])
def posts(client_id:int | None=None,db:Session=Depends(get_db)):
    q=db.query(Post)
    if client_id:q=q.filter(Post.client_id==client_id)
    return q.order_by(Post.scheduled_at.desc(),Post.id.desc()).all()

@app.post("/api/posts",response_model=PostOut,status_code=201)
def add_post(payload:PostCreate,db:Session=Depends(get_db)):
    require_client(db,payload.client_id)
    validate_asset(db,payload.asset_id,payload.client_id)
    row=Post(**payload.model_dump());db.add(row);db.commit();db.refresh(row);return row

@app.patch("/api/posts/{id}",response_model=PostOut)
def patch_post(id:int,payload:PostPatch,db:Session=Depends(get_db)):
    row=db.get(Post,id)
    if not row:raise HTTPException(404,"Post not found")
    patch=payload.model_dump(exclude_unset=True)
    client_id=patch.get("client_id",row.client_id)
    require_client(db,client_id)
    validate_asset(db,patch.get("asset_id",row.asset_id),client_id)
    proposed_status=patch.get("status",row.status)
    proposed_date=patch.get("scheduled_at",row.scheduled_at)
    if proposed_status=="scheduled" and proposed_date is None:
        raise HTTPException(422,"Scheduled posts need a date")
    for k,v in patch.items():setattr(row,k,v)
    db.commit();db.refresh(row);return row

@app.delete("/api/posts/{id}",status_code=204)
def delete_post(id:int,db:Session=Depends(get_db)):
    row=db.get(Post,id)
    if not row:raise HTTPException(404,"Post not found")
    db.delete(row);db.commit()


def asset_out(a:Asset):
    return AssetOut(id=a.id,client_id=a.client_id,filename=a.filename,mime_type=a.mime_type,
                    size_bytes=a.size_bytes,url=f"/media/{a.stored_name}",created_at=a.created_at)

@app.get("/api/assets",response_model=list[AssetOut])
def assets(client_id:int | None=None,db:Session=Depends(get_db)):
    q=db.query(Asset)
    if client_id:q=q.filter(Asset.client_id==client_id)
    return [asset_out(a) for a in q.order_by(Asset.created_at.desc()).all()]

@app.post("/api/assets",response_model=AssetOut,status_code=201)
async def upload_asset(client_id:int=Form(...),file:UploadFile=File(...),db:Session=Depends(get_db)):
    require_client(db,client_id)
    ext=Path(file.filename or "").suffix.lower()
    mime=(file.content_type or "").split(";")[0].lower()
    if mime not in ALLOWED or ext not in EXTENSIONS[mime]:
        raise HTTPException(415,"Supported files: JPG, PNG, WEBP, GIF, MP4, MOV, WEBM")
    stored=f"{uuid4().hex}{ext}"
    path=MEDIA_DIR/stored
    size=0
    try:
        with open(path,"wb") as dst:
            while chunk:=await file.read(1024*1024):
                size+=len(chunk)
                if size>MAX_FILE:raise HTTPException(413,"File is larger than 100 MB")
                dst.write(chunk)
        if size==0:raise HTTPException(422,"Empty files are not supported")
        row=Asset(client_id=client_id,filename=Path(file.filename or "media").name[:255],
                  stored_name=stored,mime_type=mime,size_bytes=size)
        db.add(row);db.commit();db.refresh(row)
        return asset_out(row)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:await file.close()

@app.delete("/api/assets/{id}",status_code=204)
def delete_asset(id:int,db:Session=Depends(get_db)):
    row=db.get(Asset,id)
    if not row:raise HTTPException(404,"Asset not found")
    for post in db.query(Post).filter(Post.asset_id==id).all():post.asset_id=None
    stored=row.stored_name
    db.delete(row);db.commit();(MEDIA_DIR/stored).unlink(missing_ok=True)

@app.get("/api/analytics")
def analytics(client_id:int | None=None,days:int=Query(30,ge=7,le=365),db:Session=Depends(get_db)):
    today=date.today();start=today-timedelta(days=days-1)
    query=db.query(Metric).filter(Metric.day>=start, Metric.day<=today)
    if client_id:query=query.filter(Metric.client_id==client_id)
    entries=query.all()
    day_bins={(start+timedelta(days=d)).isoformat():dict(impressions=0,reach=0,engagements=0,views=0,followers_gained=0) for d in range(days)}
    platforms={p:dict(platform=p,impressions=0,reach=0,engagements=0,views=0,followers_gained=0) for p in ["instagram","tiktok","youtube","linkedin"]}
    summary=dict(impressions=0,reach=0,engagements=0,views=0,followers_gained=0)
    for m in entries:
        for k in summary:
            value=getattr(m,k)
            summary[k]+=value;day_bins[m.day.isoformat()][k]+=value;platforms[m.platform][k]+=value
    rate=round(summary["engagements"]/summary["impressions"]*100,2) if summary["impressions"] else 0
    return {"summary":{**summary,"engagement_rate":rate},
            "daily":[{"day":day,**vals} for day,vals in day_bins.items()],
            "platforms":[{**x,"engagement_rate":round(x["engagements"]/x["impressions"]*100,2) if x["impressions"] else 0} for x in platforms.values()],
            "source":{"demo_entries":sum(m.is_demo for m in entries),"manual_entries":sum(not m.is_demo for m in entries)},
            "days":days}

@app.post("/api/metrics")
def upsert_metric(payload:MetricIn,db:Session=Depends(get_db)):
    require_client(db,payload.client_id)
    if payload.day>date.today():raise HTTPException(422,"Metrics cannot be recorded in the future")
    m=db.query(Metric).filter(Metric.client_id==payload.client_id,Metric.platform==payload.platform,Metric.day==payload.day).first()
    if m:
        for k,v in payload.model_dump(exclude={"client_id","platform","day"}).items():setattr(m,k,v)
        m.is_demo=False
    else:
        m=Metric(**payload.model_dump(),is_demo=False);db.add(m)
    db.commit();return {"ok":True,"id":m.id,"source":"manual"}

@app.post("/api/captions/generate")
def captions_generate(payload:CaptionIn):
    return generate_captions(payload)


def csv_cell(value: str) -> str:
    """Neutralize spreadsheet formulas in user-controlled text columns."""
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) else value


@app.get("/api/reports/metrics.csv")
def export_metrics_csv(
    client_id: int | None = None,
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Download client-scoped daily metrics, with visible demo/manual provenance."""
    if client_id is not None:
        require_client(db, client_id)
    today = date.today()
    start = today - timedelta(days=days - 1)
    q = (db.query(Metric, Client.name)
         .join(Client, Client.id == Metric.client_id)
         .filter(Metric.day.between(start, today)))
    if client_id is not None:
        q = q.filter(Metric.client_id == client_id)
    rows = q.order_by(Metric.day, Client.name, Metric.platform).all()
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["date", "client", "platform", "impressions", "reach",
                     "engagements", "views", "followers_gained", "source"])
    for metric, name in rows:
        writer.writerow([metric.day.isoformat(), csv_cell(name), metric.platform,
                         metric.impressions, metric.reach, metric.engagements,
                         metric.views, metric.followers_gained,
                         "demo" if metric.is_demo else "manual"])
    filename = f"frameera-performance-{start.isoformat()}-{today.isoformat()}.csv"
    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"',
                 "Cache-Control": "no-store"},
    )
