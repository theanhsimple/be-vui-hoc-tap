-- little — Sprint 04 — storage buckets
--
-- Only what the product needs now: published learning art and recorded
-- instruction audio. Both are PUBLIC-read (they are part of published lessons)
-- and writable by content editors only. No child or family files are stored
-- (avatars come from a fixed catalogue; no photos). Private family /
-- assessment buckets are designed in docs/BACKEND_ARCHITECTURE.md §7 and will
-- be added with the first feature that needs them.
--
-- Naming: <module-slug>/<lesson-slug>/<asset-name>.<ext>, lowercase, [a-z0-9-_.]

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-learning-assets', 'public-learning-assets', true, 5242880,
    array['image/png', 'image/webp', 'image/svg+xml', 'image/jpeg']),
  ('public-audio', 'public-audio', true, 10485760,
    array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'])
on conflict (id) do nothing;

create policy learning_assets_editor_insert on storage.objects for insert to authenticated
  with check (
    bucket_id in ('public-learning-assets', 'public-audio')
    and private.has_staff_role('content_editor')
    and name ~ '^[a-z0-9_.-]+(/[a-z0-9_.-]+)*$'
  );

create policy learning_assets_editor_update on storage.objects for update to authenticated
  using (bucket_id in ('public-learning-assets', 'public-audio') and private.has_staff_role('content_editor'))
  with check (bucket_id in ('public-learning-assets', 'public-audio') and private.has_staff_role('content_editor'));

create policy learning_assets_editor_delete on storage.objects for delete to authenticated
  using (bucket_id in ('public-learning-assets', 'public-audio') and private.has_staff_role('content_editor'));

-- Reads of public buckets go through the public object URL; listing through
-- the API is limited to staff so bucket contents (incl. drafts) aren't enumerable.
create policy learning_assets_staff_select on storage.objects for select to authenticated
  using (bucket_id in ('public-learning-assets', 'public-audio') and private.is_staff());
