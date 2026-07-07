-- Create storage buckets for user avatars, team icons, and player photos.
-- Sets them to public so uploaded images are accessible via public URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',       'avatars',       true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('team-icons',    'team-icons',    true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('player-photos', 'player-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE
  SET public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Allow public (anon) reads on all three buckets.
DROP POLICY IF EXISTS "Public read avatars"       ON storage.objects;
DROP POLICY IF EXISTS "Public read team-icons"    ON storage.objects;
DROP POLICY IF EXISTS "Public read player-photos" ON storage.objects;

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read team-icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-icons');

CREATE POLICY "Public read player-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');
