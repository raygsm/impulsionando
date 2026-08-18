#!/usr/bin/env python3
import hashlib, itertools, json, mimetypes, os, re, sys, time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE = 'https://www.anamadu.com.br/'
SUPABASE_URL = os.environ['SUPABASE_URL'].rstrip('/')
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
BUCKET = os.environ.get('ANAMADU_STORAGE_BUCKET', 'anamadu-products')
HEADERS = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}', 'Content-Type':'application/json'}
SESSION = requests.Session(); SESSION.headers.update({'User-Agent':'Impulsionando-AnaMadu-Migrator/2.0'})


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
    while queue and len(seen)<180:
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
            elif any(x in p.path.lower() for x in ['/produtos','/colares','/brincos','/aneis','/anéis','/pulseiras','/tornozeleiras','/japamala','/pedras','/colecao','/coleção','/promocao','/promoção']):
                if href not in seen and href not in queue: queue.append(href)
        if '/produtos' in urlparse(url).path:
            for n in range(2,31):
                pu=urljoin(BASE,f'produtos/?page={n}')
                if pu not in seen and pu not in queue: queue.append(pu)
        if len(products)>1200: break
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
            x=float(str(v).replace(',','.'))
            if x>0:return x
        except:pass
    vals=re.findall(r'R\$\s*([0-9\.]+,[0-9]{2})',text)
    for val in vals:
        x=float(val.replace('.','').replace(',','.'))
        if x>0:return x
    return None

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
        if isinstance(x,str) and x.startswith('http') and x not in images: images.append(x)
    for img in soup.find_all('img'):
        src=img.get('data-src') or img.get('data-srcset') or img.get('src')
        if not src: continue
        src=str(src).split(',')[0].split(' ')[0]
        src=urljoin(url,src)
        if ('mitiendanube' in src or 'anamadu' in src) and src not in images: images.append(src)
    selects=[]
    for sel in soup.find_all('select'):
        label=sel.get('name') or sel.get('aria-label') or sel.get('data-variant-name') or 'opção'
        opts=[text_of(o) for o in sel.find_all('option') if text_of(o) and 'selec' not in text_of(o).lower()]
        opts=list(dict.fromkeys(opts))
        if opts: selects.append({'name':str(label)[:120],'values':opts[:50]})
    body=soup.get_text(' ',strip=True).lower()
    availability='sold_out' if ('esgotado' in body or 'sem estoque' in body) else ('available' if 'comprar' in body else 'unknown')
    cats=[]
    allowed={'COLARES','BRINCOS','ÁNEIS','ANEIS','PULSEIRAS','TORNOZELEIRAS','JAPAMALA','JAPAMALAS','PEDRAS PARA AMBIENTE','COLARES ÚNICOS (PEDRAS BRUTAS E LAPIDADAS)','COLEÇÃO CHAKRAS','COLEÇÃO COLOURS','COLEÇÃO ESCAPULÁRIOS','COLEÇÃO GLOBOS','COLEÇÃO HEMATITA','PROMOÇÃO','ÁGUA MARINHA (PEDRA DE 2026)'}
    for a in soup.find_all('a',href=True):
        t=text_of(a).upper()
        if t in allowed: cats.append(t)
    category=cats[0] if cats else None
    return {'name':name[:300],'price':price,'description':desc[:12000] or None,'images':images[:20],'options':selects[:20],'availability':availability,'category':category}

def store_image(product_key, idx, url):
    try:
        r=SESSION.get(url,timeout=40); r.raise_for_status()
        ctype=r.headers.get('content-type','').split(';')[0].lower()
        if not ctype.startswith('image/') or len(r.content)>10_485_760: return None
        ext=mimetypes.guess_extension(ctype) or '.jpg'
        if ext=='.jpe': ext='.jpg'
        obj=f'catalog/{product_key}/{idx:02d}{ext}'
        h={'apikey':SERVICE_KEY,'Authorization':f'Bearer {SERVICE_KEY}','Content-Type':ctype,'x-upsert':'true'}
        up=requests.post(f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{obj}',headers=h,data=r.content,timeout=45)
        if up.status_code not in (200,201):
            print('WARN storage',up.status_code,up.text[:160],file=sys.stderr); return None
        return f'{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{obj}'
    except Exception as e:
        print('WARN media',url,e,file=sys.stderr); return None

def upsert_product(cid,url,p):
    key=hashlib.sha256(url.encode()).hexdigest()[:16].upper()
    sku='AM-MIG-'+key
    local_images=[]
    for idx,img in enumerate(p['images'][:12],1):
        local=store_image(key,idx,img)
        if local: local_images.append(local)
    effective_images=local_images or p['images']
    payload={'company_id':cid,'sku':sku,'name':p['name'],'brand':'Ana Madú','category':p['category'],'description':p['description'],'image_url':effective_images[0] if effective_images else None,'active':True,'metadata':{'sale_price':p['price'],'currency':'BRL','availability':p['availability'],'legacy_url':url,'migration_origin':BASE,'migration_mode':'full_crawl_v2','images':effective_images,'legacy_images':p['images'],'options':p['options'],'media_internalized':bool(local_images),'migrated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}}
    r=requests.post(f'{SUPABASE_URL}/rest/v1/core_products?on_conflict=company_id,sku',headers={**HEADERS,'Prefer':'resolution=merge-duplicates,return=representation'},data=json.dumps(payload),timeout=30)
    r.raise_for_status(); row=(r.json() or [{}])[0]
    pid=row.get('id')
    if pid: sync_variants(cid,pid,sku,p)
    return row

def sync_variants(cid,pid,sku,p):
    options=p.get('options') or []
    if not options: return
    names=[o['name'] for o in options]
    values=[o['values'] for o in options]
    combos=list(itertools.product(*values))[:200]
    for n,combo in enumerate(combos,1):
        attrs=dict(zip(names,combo))
        vsku=f'{sku}-V{n:03d}'
        payload={'product_id':pid,'company_id':cid,'sku':vsku,'variant_name':' / '.join(combo)[:240],'attributes':attrs,'sale_price':p['price'],'active':p['availability']!='sold_out'}
        rr=requests.post(f'{SUPABASE_URL}/rest/v1/core_product_variants?on_conflict=company_id,sku',headers={**HEADERS,'Prefer':'resolution=merge-duplicates'},data=json.dumps(payload),timeout=30)
        if rr.status_code not in (200,201,204): print('WARN variant',vsku,rr.status_code,rr.text[:160],file=sys.stderr)

def main():
    cid=company_id(); links=product_links(); print('DISCOVERED',len(links))
    ok=0; fail=0; skipped=0
    for i,url in enumerate(links,1):
        try:
            p=parse_product(url)
            if not p or not p['price'] or p['price']<=0:
                skipped+=1; print('SKIP',url); continue
            upsert_product(cid,url,p); ok+=1; print(f'OK {i}/{len(links)} {p["name"]}')
        except Exception as e:
            fail+=1; print('FAIL',url,e,file=sys.stderr)
    summary={'discovered':len(links),'imported':ok,'skipped':skipped,'failed':fail}
    print(json.dumps(summary))
    if ok<20: raise SystemExit('catalog import too small; refusing to mark successful')

if __name__=='__main__': main()
