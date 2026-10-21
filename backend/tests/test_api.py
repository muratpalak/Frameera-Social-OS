from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0,str(Path(__file__).parents[1]))
from main import app
from database import Base, get_db

@pytest.fixture
def client(tmp_path):
    engine=create_engine(f"sqlite:///{tmp_path/'test.sqlite3'}",connect_args={"check_same_thread":False})
    Base.metadata.create_all(bind=engine)
    factory=sessionmaker(bind=engine)
    def override():
        db=factory()
        try:yield db
        finally:db.close()
    app.dependency_overrides[get_db]=override
    with TestClient(app) as api:
        yield api
    app.dependency_overrides.clear()
    engine.dispose()

def make_client(api,name="Test Brand"):
    r=api.post('/api/clients',json={'name':name,'industry':'Beauty','color':'#8B8CFF','brand_voice':'luxury','accounts':{'instagram':'@test'}})
    assert r.status_code==201,r.text
    return r.json()

def test_client_and_post_crud(client):
    c=make_client(client)
    assert any(x['id']==c['id'] for x in client.get('/api/clients').json())
    created=client.post('/api/posts',json={'client_id':c['id'],'platform':'instagram','title':'Test launch','caption':'Hello','status':'draft'})
    assert created.status_code==201,created.text
    post=created.json()
    updated=client.patch(f"/api/posts/{post['id']}",json={'status':'scheduled','scheduled_at':'2026-12-12T16:30:00'})
    assert updated.status_code==200 and updated.json()['status']=='scheduled'
    assert len(client.get(f"/api/posts?client_id={c['id']}").json())==1
    assert client.delete(f"/api/posts/{post['id']}").status_code==204

def test_validation_and_metrics(client):
    c=make_client(client)
    missing=client.post('/api/posts',json={'client_id':c['id'],'platform':'instagram','title':'Oops','status':'scheduled'})
    assert missing.status_code==422
    metric={'client_id':c['id'],'platform':'instagram','day':'2026-10-01','impressions':1000,'reach':700,'engagements':80,'views':800,'followers_gained':10}
    assert client.post('/api/metrics',json=metric).status_code==200
    result=client.get(f'/api/analytics?client_id={c["id"]}&days=365').json()
    assert result['summary']['engagement_rate']==8
    assert result['source']['manual_entries']==1
    metric['engagements']=100
    client.post('/api/metrics',json=metric)
    result=client.get(f'/api/analytics?client_id={c["id"]}&days=365').json()
    assert result['source']['manual_entries']==1 and result['summary']['engagement_rate']==10

def test_caption_generator(client):
    r=client.post('/api/captions/generate',json={'topic':'Yeni koleksiyon','platform':'instagram','tone':'luxury','language':'tr'})
    assert r.status_code==200
    assert len(r.json()['variants'])==3
    assert 'Yeni koleksiyon' in r.json()['variants'][0]['caption']

def test_media_security(client):
    c=make_client(client)
    invalid=client.post('/api/assets',data={'client_id':c['id']},files={'file':('bad.exe',b'hi','application/octet-stream')})
    assert invalid.status_code==415
    uploaded=client.post('/api/assets',data={'client_id':c['id']},files={'file':('photo.png',b'fake-for-test','image/png')})
    assert uploaded.status_code==201,uploaded.text
    a=uploaded.json()
    assert client.get(a['url']).status_code==200
    assert client.delete(f"/api/assets/{a['id']}").status_code==204

def test_client_delete_cascades(client):
    c=make_client(client)
    assert client.post('/api/posts',json={'client_id':c['id'],'platform':'linkedin','title':'Draft','status':'draft'}).status_code==201
    assert client.delete(f"/api/clients/{c['id']}").status_code==204
    assert client.get('/api/posts').json()==[]

def test_csv_report_filters_and_provenance(client):
    from datetime import date
    import csv
    from io import StringIO
    c1=make_client(client, '=SUM(A1:A2)')
    c2=make_client(client, 'Second Brand')
    day=date.today().isoformat()
    entry={'platform':'instagram','day':day,'impressions':100,
           'reach':80,'engagements':8,'views':70,'followers_gained':2}
    for c in (c1,c2):
        assert client.post('/api/metrics',json={'client_id':c['id'],**entry}).status_code==200
    response=client.get(f'/api/reports/metrics.csv?client_id={c1["id"]}&days=7')
    assert response.status_code==200
    assert 'text/csv' in response.headers['content-type']
    assert 'attachment;' in response.headers['content-disposition']
    rows=list(csv.DictReader(StringIO(response.text.lstrip('\ufeff'))))
    assert len(rows)==1
    assert rows[0]['client']=="'=SUM(A1:A2)"  # Excel formula injection protection
    assert rows[0]['source']=='manual'
    assert rows[0]['impressions']=='100'
    assert len(list(csv.DictReader(StringIO(client.get('/api/reports/metrics.csv?days=7').text.lstrip('\ufeff')))))==2
    assert client.get('/api/reports/metrics.csv?client_id=999999').status_code==404
    assert client.get('/api/reports/metrics.csv?days=366').status_code==422
