-- Seed: first admin user and a sample house.
-- Replace the UUID and email with your own before running.

-- Create a sample house
INSERT INTO houses (id, name_en, name_ml, location)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Thattakunnel Family',
  'തട്ടകുന്നേൽ കുടുംബം',
  'Thiruvalla, Kerala'
);

-- After registering the first user via Supabase Auth dashboard or invite flow,
-- promote them to admin by running:
--
--   UPDATE user_profiles SET is_admin = true WHERE id = '<your-auth-user-uuid>';
