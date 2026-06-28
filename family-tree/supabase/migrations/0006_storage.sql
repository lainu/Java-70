-- Storage bucket for family tree assets (profile photos, house covers)

INSERT INTO storage.buckets (id, name, public)
VALUES ('family-tree-assets', 'family-tree-assets', true);

-- Public read on all objects in the bucket
CREATE POLICY "public_read_assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'family-tree-assets');

-- Authenticated users can upload their own profile photo
CREATE POLICY "authenticated_upload_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'family-tree-assets'
    AND auth.uid() IS NOT NULL
    AND name LIKE 'photos/%'
  );

-- Admins can upload anything (house covers, etc.)
CREATE POLICY "admin_upload_all"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'family-tree-assets'
    AND is_admin()
  );

-- Users can delete/replace their own uploads; admins can delete anything
CREATE POLICY "owner_or_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'family-tree-assets'
    AND (auth.uid()::text = (storage.foldername(name))[2] OR is_admin())
  );
