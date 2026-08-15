alter table public.wmp_equipment_catalog add column if not exists manufacturer_id uuid references public.wmp_equipment_manufacturers(id) on delete restrict;
alter table public.wmp_equipment_catalog add column if not exists model_id uuid references public.wmp_equipment_models(id) on delete restrict;
create index if not exists wmp_equipment_catalog_manufacturer_id_idx on public.wmp_equipment_catalog(manufacturer_id);
create index if not exists wmp_equipment_catalog_model_id_idx on public.wmp_equipment_catalog(model_id);

create table if not exists public.wmp_equipment_reference_requests (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  request_type text not null check(request_type in ('MANUFACTURER','MODEL')), requested_name text not null check(char_length(trim(requested_name)) between 2 and 160),
  manufacturer_id uuid references public.wmp_equipment_manufacturers(id) on delete set null, category text, reference_url text,
  status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','MERGED')),
  resulting_manufacturer_id uuid references public.wmp_equipment_manufacturers(id) on delete set null,
  resulting_model_id uuid references public.wmp_equipment_models(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null, reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.wmp_equipment_reference_requests enable row level security;
revoke all on public.wmp_equipment_reference_requests from public,anon;
grant select,insert,update on public.wmp_equipment_reference_requests to authenticated,service_role;
create index if not exists wmp_equipment_reference_requests_status_idx on public.wmp_equipment_reference_requests(tenant_id,status,request_type,created_at desc);

with t as (select id from public.communication_tenants where slug='wmp' and active=true limit 1)
insert into public.wmp_equipment_manufacturers(tenant_id,name,website,active)
select t.id,v.name,v.website,true from t cross join (values
 ('Allen & Heath','https://www.allen-heath.com'),('Aputure','https://www.aputure.com'),('Audio-Technica','https://www.audio-technica.com'),('Behringer','https://www.behringer.com'),('Blackmagic Design','https://www.blackmagicdesign.com'),('Bose Professional','https://boseprofessional.com'),('Chamsys','https://chamsyslighting.com'),('Chauvet Professional','https://www.chauvetprofessional.com'),('Crown','https://www.crownaudio.com'),('d&b audiotechnik','https://www.dbaudio.com'),('Denon DJ','https://www.denondj.com'),('DiGiCo','https://digico.biz'),('Electro-Voice','https://products.electrovoice.com'),('Elation Professional','https://www.elationlighting.com'),('Focusrite','https://focusrite.com'),('Genelec','https://www.genelec.com'),('JBL Professional','https://jblpro.com'),('K-array','https://www.k-array.com'),('L-Acoustics','https://www.l-acoustics.com'),('Lab Gruppen','https://www.labgruppen.com'),('Mackie','https://mackie.com'),('MA Lighting','https://www.malighting.com'),('Martin Professional','https://www.martin.com'),('Midas','https://www.midasconsoles.com'),('Neumann','https://www.neumann.com'),('Nexo','https://www.nexo-sa.com'),('Pioneer DJ / AlphaTheta','https://alphatheta.com'),('QSC','https://www.qsys.com'),('RCF','https://www.rcf.it'),('Riedel Communications','https://www.riedel.net'),('Robe Lighting','https://www.robe.cz'),('Sennheiser','https://www.sennheiser.com'),('Shure','https://www.shure.com'),('Soundcraft','https://www.soundcraft.com'),('Sony','https://pro.sony'),('SSL','https://www.solidstatelogic.com'),('Technics','https://www.technics.com'),('Yamaha Pro Audio','https://www.yamahaproaudio.com'),('Zoom','https://zoomcorp.com'),('ADJ','https://www.adj.com'),('AKG','https://www.akg.com'),('Antari','https://antari.com'),('Astera','https://astera-led.com'),('BSS Audio','https://bssaudio.com'),('DBX','https://dbxpro.com'),('EAW','https://eaw.com'),('ETC','https://www.etcconnect.com'),('Funktion-One','https://funktion-one.com'),('HK Audio','https://hkaudio.com'),('K&M','https://www.k-m.de'),('Meyer Sound','https://meyersound.com'),('Panasonic Connect','https://connect.panasonic.com'),('Powersoft','https://www.powersoft.com'),('Radial Engineering','https://www.radialeng.com'),('RME','https://www.rme-audio.de'),('Roland Professional A/V','https://proav.roland.com'),('Samsung','https://www.samsung.com'),('SPL','https://spl.audio'),('Turbosound','https://www.turbosound.com'),('Universal Audio','https://www.uaudio.com'),('Whirlwind','https://www.whirlwindusa.com')
) as v(name,website)
on conflict(tenant_id,name) do update set website=coalesce(excluded.website,public.wmp_equipment_manufacturers.website),active=true;