-- Row Level Security policies

ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_changes ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- houses: public read, admin write
CREATE POLICY "public_read_houses" ON houses FOR SELECT USING (true);
CREATE POLICY "admin_insert_houses" ON houses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_update_houses" ON houses FOR UPDATE USING (is_admin());
CREATE POLICY "admin_delete_houses" ON houses FOR DELETE USING (is_admin());

-- persons: public read, admin direct write
CREATE POLICY "public_read_persons" ON persons FOR SELECT USING (true);
CREATE POLICY "admin_insert_persons" ON persons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_update_persons" ON persons FOR UPDATE USING (is_admin());
CREATE POLICY "admin_delete_persons" ON persons FOR DELETE USING (is_admin());

-- relationships: public read, admin write
CREATE POLICY "public_read_relationships" ON relationships FOR SELECT USING (true);
CREATE POLICY "admin_insert_relationships" ON relationships FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_update_relationships" ON relationships FOR UPDATE USING (is_admin());
CREATE POLICY "admin_delete_relationships" ON relationships FOR DELETE USING (is_admin());

-- pending_changes: authenticated users can insert; submitter sees own; admin sees all
CREATE POLICY "authenticated_insert_pending" ON pending_changes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "own_or_admin_read_pending" ON pending_changes
  FOR SELECT USING (
    submitted_by = auth.uid() OR is_admin()
  );

CREATE POLICY "admin_update_pending" ON pending_changes
  FOR UPDATE USING (is_admin());

-- invites: admin only
CREATE POLICY "admin_all_invites" ON invites
  FOR ALL USING (is_admin());

-- user_profiles: own row read/update; admin sees all
CREATE POLICY "own_profile_read" ON user_profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "own_profile_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admin_all_profiles" ON user_profiles
  FOR ALL USING (is_admin());
