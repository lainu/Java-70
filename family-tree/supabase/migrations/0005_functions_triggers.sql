-- Auto-create user_profile when a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER pending_changes_updated_at
  BEFORE UPDATE ON pending_changes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- BFS generation number recalculation
-- Called via RPC after any relationship change is approved.
-- Iteratively propagates generation_number from root persons downward.
CREATE OR REPLACE FUNCTION recalculate_generations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  changed BOOLEAN := true;
BEGIN
  -- Reset all generation numbers
  UPDATE persons SET generation_number = NULL;

  -- Persons with no parents are generation 0 (roots)
  UPDATE persons SET generation_number = 0
  WHERE id NOT IN (
    SELECT person_b_id FROM relationships
    WHERE relationship_type IN ('biological_child', 'adopted_child')
  );

  -- BFS: iterate until no more changes
  WHILE changed LOOP
    changed := false;

    UPDATE persons p
    SET generation_number = sub.gen
    FROM (
      SELECT
        r.person_b_id AS child_id,
        MAX(parent.generation_number) + 1 AS gen
      FROM relationships r
      JOIN persons parent ON parent.id = r.person_a_id
      WHERE r.relationship_type IN ('biological_child', 'adopted_child')
        AND parent.generation_number IS NOT NULL
      GROUP BY r.person_b_id
    ) sub
    WHERE p.id = sub.child_id
      AND (p.generation_number IS NULL OR p.generation_number < sub.gen);

    IF FOUND THEN
      changed := true;
    END IF;
  END LOOP;
END;
$$;
