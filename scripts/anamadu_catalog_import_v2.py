#!/usr/bin/env python3
import hashlib, json, mimetypes, os, re, time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE='https://www.anamadu.com.br/'
SUPABASE_URL=os.environ['SUPABASE_URL'].rstrip('/')
SERVICE_KEY=os.environ['SUPABASE_SERVICE_ROLE_KEY']
BUCKET=os.getenv('ANAMADU_STORAGE_BUCKET','anamadu-products')
H={'apikey':SERVICE_KEY,'Authorization':f'Bearer {SERVICE_KEY}'}
S=requests.Session(); S.headers.update({'User-Agent':'Impulsionando-AnaMadu-FullCatalog/2.0','Accept-Language':'pt-BR,pt;q=0.9'})

def sb_get(table,params):
 r=requests.get(f'{SUPABASE_URL}/rest/v1/{table}',headers=H,params=params,timeout=30); r.raise_for_status(); return r.json()

def company_id():
 rows=sb_get('communication_tenants',{'slug':'eq.anamadu','active':'eq.true','select':'company_id','limit':'1'})
 if not rows: raise RuntimeError('tenant_not_found')
 return rows[0]['company_id']

def html(url):
 r=S.get(url,timeout=35); r.raise_for_status(); return r.text

def discover():
 links=set(); empty=0
 for page in range(1,61):
  url=urljoin(BASE,'produtos/') + ('' if page==1 else f'?page={page}')
  soup=BeautifulSoup(html(url),'html.parser')
  before=len(links)
  for a in soup.find_all('a',href=True):
   u=urljoin(url,a['href']).split('#')[0].split('?')[0]
   p=urlparse(u)
   path=p.path.rstrip('/')+'/'
   if p.netloc in ('anamadu.com.br','www.anamadu.com.br') and path.startswith('/produtos/') and path!='/produtos/': links.add(u)
  added=len(links)-before
  print(f'DISCOVERY page={page} added={added} total={len(links)}')
  empty=empty+1 if added==0 else 0
  if page>=3 and empty>=3: break
 return sorted(links)

def ld_product(soup):
 for tag in soup.find_all('script',type='application/ld+json'):
  try:
   obj=json.loads(tag.get_text(strip=True) or '{}'); nodes=obj if isinstance(obj,list) else obj.get('@graph',[obj]) if isinstance(obj,dict) else []
   for n in nodes:
    if isinstance(n,dict) and str(n.get('@type','')).lower()=='product': return n
  except Exception: pass
 return {}

def clean_text(x,maxlen=12000): return re.sub(r'\s+',' ',str(x or '')).strip()[:maxlen]

def price_of(soup,ld):
 offers=ld.get('offers',{}) if isinstance(ld,dict) else {}
 if isinstance(offers,list): offers=offers[0] if offers else {}
 vals=[]
 if isinstance(offers,dict): vals += [offers.get('price'),offers.get('lowPrice')]
 for v in vals:
  try:
   x=float(str(v).replace('.','').replace(',','.')) if ',' in str(v) else float(v)
   if x>0:return x
  except Exception: pass
 for v in re.findall(r'R\$\s*([0-9\.]+,[0-9]{2})',soup.get_text(' ',strip=True)):
  x=float(v.replace('.','').replace(',','.'))
  if x>0:return x
 return None

def parse(url):
 soup=BeautifulSoup(html(url),'html.parser'); ld=ld_product(soup)
 name=clean_text(ld.get('name') if isinstance(ld,dict) else '',300) or clean_text(soup.find('h1').get_text(' ',strip=True) if soup.find('h1') else '',300)
 if not name:return None
 desc=clean_text(ld.get('description') if isinstance(ld,dict) else '')
 if not desc:
  candidates=[clean_text(x.get_text(' ',strip=True)) for x in soup.select('.product-description,.description,[data-store="product-description"]')]
  desc=max(candidates,key=len,default='')
 images=[]; raw=ld.get('image',[]) if isinstance(ld,dict) else []
 if isinstance(raw,str): raw=[raw]
 for x in raw:
  if isinstance(x,str) and x.startswith('http') and x not in images: images.append(x)
 for img in soup.find_all('img'):
  src=img.get('data-src') or img.get('src')
  if not src: continue
  u=urljoin(url,str(src).split(',')[0].split(' ')[0])
  if ('mitiendanube' in u or 'anamadu.com.br' in u) and u not in images: images.append(u)
 options=[]
 for sel in soup.find_all('select'):
  label=clean_text(sel.get('name') or sel.get('aria-label') or sel.get('data-variant-name') or 'Opção',120)
  values=[]
  for opt in sel.find_all('option'):
   v=clean_text(opt.get_text(' ',strip=True),160)
   if v and 'selec' not in v.lower() and v not in values: values.append(v)
  if values: options.append({'name':label,'values':values[:100]})
 text=soup.get_text(' ',strip=True).lower()
 status='sold_out' if ('esgotado' in text or 'sem estoque' in text) else ('available' if ('comprar' in text or 'última peça' in text) else 'unknown')
 category=None
 allowed={'COLARES','BRINCOS','ÁNEIS','ANEIS','PULSEIRAS','TORNOZELEIRAS','JAPAMALA','JAPAMALAS','PEDRAS PARA AMBIENTE','COLARES ÚNICOS (PEDRAS BRUTAS E LAPIDADAS)','COLEÇÃO CHAKRAS','COLEÇÃO COLOURS','COLEÇÃO ESCAPULÁRIOS','COLEÇÃO GLOBOS','COLEÇÃO HEMATITA','PROMOÇÃO','ÁGUA MARINHA (PEDRA DE 2026)'}
 for a in soup.find_all('a'):
  t=clean_text(a.get_text(' ',strip=True),200).upper()
  if t in allowed: category=t; break
 return {'name':name,'description':desc or None,'price':price_of(soup,ld),'images':images[:20],'options':options[:20],'status':status,'category':category}

def store_image(key,index,url):
 try:
  r=S.get(url,timeout=40); r.raise_for_status()
  ct=(r.headers.get('content-type') or '').split(';')[0].lower()
  ext=mimetypes.guess_extension(ct) or '.webp'; ext='.jpg' if ext=='.jpe' else ext
  if ext not in ('.jpg','.jpeg','.png','.webp'): ext='.webp'
  path=f'catalog/{key}/{index:02d}{ext}'
  uh={**H,'Content-Type':ct or 'image/webp','x-upsert':'true'}
  u=requests.post(f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}',headers=uh,data=r.content,timeout=45)
  if u.status_code not in (200,201): return None
  return f'{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}'
 except Exception as e:
  print('MEDIA_WARN',url,str(e)); return None

def upsert(cid,url,p):
 key=hashlib.sha256(url.encode()).hexdigest()[:20]
 sku='AM-FULL-'+key.upper()
 local=[]
 for i,img in enumerate(p['images'][:8],1):
  saved=store_image(key,i,img)
  if saved: local.append(saved)
 payload={'company_id':cid,'sku':sku,'name':p['name'],'brand':'Ana Madú','category':p['category'],'description':p['description'],'image_url':local[0] if local else (p['images'][0] if p['images'] else None),'active':True,'metadata':{'sale_price':p['price'],'currency':'BRL','availability':p['status'],'legacy_url':url,'migration_origin':BASE,'migration_mode':'full_crawl','legacy_images':p['images'],'internal_images':local,'options':p['options'],'migrated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}}
 headers={**H,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'}
 r=requests.post(f'{SUPABASE_URL}/rest/v1/core_products?on_conflict=company_id,sku',headers=headers,data=json.dumps(payload,ensure_ascii=False).encode(),timeout=30)
 r.raise_for_status()

def main():
 cid=company_id(); links=discover(); print('DISCOVERED_TOTAL',len(links))
 if len(links)<20: raise SystemExit('discovery_too_small')
 ok=fail=skip=0
 for n,url in enumerate(links,1):
  try:
   p=parse(url)
   if not p or not p['price'] or p['price']<=0: skip+=1; print('SKIP',url); continue
   upsert(cid,url,p); ok+=1; print(f'IMPORTED {n}/{len(links)} {p["name"]}')
  except Exception as e:
   fail+=1; print('FAIL',url,str(e))
 print(json.dumps({'discovered':len(links),'imported':ok,'skipped':skip,'failed':fail},ensure_ascii=False))
 if ok<20: raise SystemExit('import_too_small')

if __name__=='__main__': main()
