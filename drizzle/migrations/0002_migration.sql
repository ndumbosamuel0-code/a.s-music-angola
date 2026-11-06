
create policy "covers read all" on storage.objects for select to anon, authenticated using (bucket_id = 'covers');
create policy "covers upload own" on storage.objects for insert to authenticated with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers admin" on storage.objects for all to authenticated using (bucket_id = 'covers' and public.has_role(auth.uid(),'admin')) with check (bucket_id = 'covers' and public.has_role(auth.uid(),'admin'));
create policy "audio stream licensed" on storage.objects for select to anon, authenticated using (bucket_id = 'audio' and public.can_stream(name));
create policy "audio own read" on storage.objects for select to authenticated using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio upload own" on storage.objects for insert to authenticated with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio admin" on storage.objects for all to authenticated using (bucket_id = 'audio' and public.has_role(auth.uid(),'admin')) with check (bucket_id = 'audio' and public.has_role(auth.uid(),'admin'));
create policy "license docs admin" on storage.objects for all to authenticated using (bucket_id = 'license-docs' and public.has_role(auth.uid(),'admin')) with check (bucket_id = 'license-docs' and public.has_role(auth.uid(),'admin'));
