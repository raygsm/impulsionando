#!/usr/bin/env python3
import hashlib, json, os, re, sys, time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE = 'https://www.anamadu.com.br/'
SUPABASE_URL = os.environ['SUPABASE_URL'].rstrip('/')
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
HEADERS = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}', 'Content-Type':'application/json'}
SESSION = requests.Session(); SESSION.headers.update({'User-Agent':'Impulsionando-AnaMadu-Migrator/1.0'})


def rest(path, params=None):
    r=requests.get(f'{SUPABASE_URL}/rest/v1/{path}',headers=HEADERS,params=params,timeout=30); r.raise_for_status(); return r.json()

def company_id():
    rows=rest('communication_tenants',{'slug':'eq.anamadu','active':'eq.true','select':'company_id','limit':'1'})
    if not rows: raise RuntimeError('tenant anamadu not found')
    return rows[0]['company_id']

def get(url):
    r=SESSION.get(url,timeout=35); r.raise_for_status(); return r.text

def product_links():
    seeds=[BASE, urljoin(BASE,'produtos/')]
    seen=set(); products=set(); queue=list(seeds)
    while queue and len(seen)<120:
        url=queue.pop(0)
        if url in seen: continue
        seen.add(url)
        try: html=get(url)
        except Exception as e:
            print('WARN fetch',url,e,file=sys.stderr); continue
        soup=BeautifulSoup(html,'html.parser')
        for a in soup.find_all('a',href=True):
            href=urljoin(url,a['href']).split('#')[0]
            p=urlparse(href)
            if p.netloc not in ('www.anamadu.com.br','anamadu.com.br'): continue
            if '/produtos/' in p.path and p.path.rstrip('/')!='/produtos': products.add(href)
            elif any(x in p.path.lower() for x in ['/colares','/brincos','/aneis','/anéis','/pulseiras','/tornozeleiras','/japamala','/pedras','/colecao','/coleção','/promocao','/promoção']):
                if href not in seen and href not in queue: queue.append(href)
        # Nuvemshop pagination fallback
        if '/produtos' in p.path:
            for n in range(2,16):
                pu=urljoin(BASE,f'produtos/?page={n}')
                if pu not in seen and pu not in queue: queue.append(pu)
        if len(products)>800: break
    return sorted(products)

def ld_product(soup):
    for s in soup.find_all('script',type='application/ld+json'):
        try:
            data=json.loads(s.get_text(strip=True) or '{}')
            nodes=data if isinstance(data,list) else data.get('@graph',[data]) if isinstance(data,dict) else []
            for node in nodes:
                if isinstance(node,dict) and str(node.get('@type','')).lower()=='product': return node
        except Exception: pass
    return {}

def parse_price(text, ld):
    offers=ld.get('offers',{}) if isinstance(ld,dict) else {}
    if isinstance(offers,list): offers=offers[0] if offers else {}
    for v in [offers.get('price') if isinstance(offers,dict) else None]:
        try:
            x=float(str(v).replace(',','.')); 
            if x>0:return x
        except:pass
    m=re.search(r'R\$\s*([0-9\.]+,[0-9]{2})',text)
    return float(m.group(1).replace('.','').replace(',','.')) if m else None

def text_of(el): return ' '.join(el.stripped_strings) if el else ''

def parse_product(url):
    html=get(url); soup=BeautifulSoup(html,'html.parser'); ld=ld_product(soup)
    h1=soup.find('h1'); name=(ld.get('name') if isinstance(ld,dict) else None) or text_of(h1)
    if not name:return None
    price=parse_price(soup.get_text(' ',strip=True),ld)
    desc=(ld.get('description') if isinstance(ld,dict) else None) or ''
    if not desc:
        candidates=soup.select('.product-description, .description, [data-store="product-description"]')
        desc=max((text_of(x) for x in candidates),key=len,default='')
    images=[]
    raw=ld.get('image',[]) if isinstance(ld,dict) else []
    if isinstance(raw,str):raw=[raw]
    for x in raw:
        if isinstance(x,str) and x.startswith('http'): images.append(x)
    for img in soup.find_all('img',src=True):
        src=urljoin(url,img.get('data-src') or img.get('src'))
        if ('mitiendanube' in src or 'anamadu' in src) and src not in images: images.append(src)
    selects=[]
    for sel in soup.find_all('select'):
        label=sel.get('name') or sel.get('aria-label') or sel.get('data-variant-name') or 'opção'
        opts=[text_of(o) for o in sel.find_all('option') if text_of(o) and 'selec' not in text_of(o).lower()]
        if opts: selects.append({'name':label,'values':opts})
    body=soup.get_text(' ',strip=True).lower()
    availability='sold_out' if 'esgotado' in body else ('available' if 'comprar' in body else 'unknown')
    cats=[]
    for a in soup.find_all('a',href=True):
        t=text_of(a).upper()
        if t in {'COLARES','BRINCOS','ÁNEIS','ANEIS','PULSEIRAS','TORNOZELEIRAS','JAPAMALA','PEDRAS PARA AMBIENTE'}: cats.append(t)
    category=cats[0] if cats else None
    return {'name':name[:300],'price':price,'description':desc[:12000] or None,'images':images[:20],'options':selects[:20],'availability':availability,'category':category}

def upsert_product(cid,url,p):
    sku='AM-MIG-'+hashlib.sha256(url.encode()).hexdigest()[:16].upper()
    payload={'company_id':cid,'sku':sku,'name':p['name'],'brand':'Ana Madú','category':p['category'],'description':p['description'],'image_url':p['images'][0] if p['images'] else None,'active':True,'metadata':{'sale_price':p['price'],'currency':'BRL','availability':p['availability'],'legacy_url':url,'migration_origin':BASE,'migration_mode':'full_crawl','images':p['images'],'options':p['options'],'migrated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}}
    r=requests.post(f'{SUPABASE_URL}/rest/v1/core_products?on_conflict=company_id,sku',headers={**HEADERS,'Prefer':'resolution=merge-duplicates,return=representation'},data=json.dumps(payload),timeout=30)
    r.raise_for_status(); return (r.json() or [{}])[0]

def main():
    cid=company_id(); links=product_links(); print('DISCOVERED',len(links))
    ok=0; fail=0
    for i,url in enumerate(links,1):
        try:
            p=parse_product(url)
            if not p or not p['price'] or p['price']<=0:
                print('SKIP',url); continue
            upsert_product(cid,url,p); ok+=1; print(f'OK {i}/{len(links)} {p["name"]}')
        except Exception as e:
            fail+=1; print('FAIL',url,e,file=sys.stderr)
    print(json.dumps({'discovered':len(links),'imported':ok,'failed':fail}))
    if ok<20: raise SystemExit('catalog import too small; refusing to mark successful')

if __name__=='__main__': main()
