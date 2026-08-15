insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('talentos-fotos','talentos-fotos',false,10485760,array['image/jpeg','image/png','image/webp']::text[]),
 ('talentos-videos','talentos-videos',false,52428800,array['video/mp4','video/webm','video/quicktime']::text[]),
 ('talentos-curriculos','talentos-curriculos',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]),
 ('marocas-fotos','marocas-fotos',false,15728640,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists talentos_storage_select_own on storage.objects;
create policy talentos_storage_select_own on storage.objects for select to authenticated
using(bucket_id in('talentos-fotos','talentos-videos','talentos-curriculos') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists talentos_storage_insert_own on storage.objects;
create policy talentos_storage_insert_own on storage.objects for insert to authenticated
with check(bucket_id in('talentos-fotos','talentos-videos','talentos-curriculos') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists talentos_storage_update_own on storage.objects;
create policy talentos_storage_update_own on storage.objects for update to authenticated
using(bucket_id in('talentos-fotos','talentos-videos','talentos-curriculos') and owner_id=auth.uid()::text)
with check(bucket_id in('talentos-fotos','talentos-videos','talentos-curriculos') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists talentos_storage_delete_own on storage.objects;
create policy talentos_storage_delete_own on storage.objects for delete to authenticated
using(bucket_id in('talentos-fotos','talentos-videos','talentos-curriculos') and owner_id=auth.uid()::text);

drop policy if exists marocas_storage_select on storage.objects;
create policy marocas_storage_select on storage.objects for select to authenticated
using(bucket_id='marocas-fotos' and (public.user_belongs_to_company(auth.uid(),public.marocas_company_id()) or public.is_impulsionando_staff(auth.uid())));
drop policy if exists marocas_storage_insert on storage.objects;
create policy marocas_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='marocas-fotos' and (public.user_belongs_to_company(auth.uid(),public.marocas_company_id()) or public.is_impulsionando_staff(auth.uid())));
drop policy if exists marocas_storage_update on storage.objects;
create policy marocas_storage_update on storage.objects for update to authenticated
using(bucket_id='marocas-fotos' and (public.user_belongs_to_company(auth.uid(),public.marocas_company_id()) or public.is_impulsionando_staff(auth.uid())))
with check(bucket_id='marocas-fotos' and (public.user_belongs_to_company(auth.uid(),public.marocas_company_id()) or public.is_impulsionando_staff(auth.uid())));
drop policy if exists marocas_storage_delete on storage.objects;
create policy marocas_storage_delete on storage.objects for delete to authenticated
using(bucket_id='marocas-fotos' and (public.user_belongs_to_company(auth.uid(),public.marocas_company_id()) or public.is_impulsionando_staff(auth.uid())));

grant execute on function public.marocas_company_id() to authenticated;