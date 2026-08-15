-- Tracks production migration 20260815103443.
insert into public.reference_option_sets(key,name,description,scope,active)
values
 ('wmp_event_types','Tipos de evento WMP','Tipos canônicos de evento para briefing, CRM, proposta e relatórios.','vertical',true),
 ('wmp_partner_categories','Categorias de parceiros WMP','Categorias canônicas de profissionais e fornecedores WMP.','vertical',true)
on conflict(key) do update set name=excluded.name,description=excluded.description,active=true,updated_at=now();

with s as (select id from public.reference_option_sets where key='wmp_event_types')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,'{}'::jsonb from s cross join (values
 ('casamento','Casamento',10),('aniversario','Aniversário',20),('corporativo','Corporativo',30),('congresso','Congresso / convenção',40),('palestra','Palestra',50),('formatura','Formatura',60),('show','Show / festival',70),('festa','Festa / celebração',80),('hotelaria','Evento de hotelaria',90),('restaurante','Evento em restaurante / bar',100),('reveillon','Réveillon',110),('carnaval','Carnaval',120),('karaoke','Karaokê',130),('lancamento','Lançamento / ativação de marca',140),('premiacao','Premiação / gala',150),('social_outro','Outro evento social curado',900),('outro_curado','Outro evento curado pela WMP',999)
) as v(code,label,ord)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,updated_at=now();

with s as (select id from public.reference_option_sets where key='wmp_partner_categories')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,'{}'::jsonb from s cross join (values
 ('dj','DJ',10),('musico','Músico / banda',20),('tecnico_som','Técnico de som',30),('tecnico_luz','Técnico de iluminação',40),('tecnico_video','Técnico de vídeo',50),('produtor','Produtor de eventos',60),('cerimonialista','Cerimonialista',70),('fotografo','Fotógrafo',80),('videomaker','Videomaker',90),('fornecedor','Fornecedor',100),('locadora','Locadora de equipamentos',110),('outro_curado','Outro parceiro curado',999)
) as v(code,label,ord)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,updated_at=now();
