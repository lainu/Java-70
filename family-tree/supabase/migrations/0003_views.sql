-- Convenience views for relationship queries

CREATE VIEW person_parents AS
SELECT
  person_b_id AS person_id,
  person_a_id AS parent_id
FROM relationships
WHERE relationship_type IN ('biological_child', 'adopted_child');

CREATE VIEW person_children AS
SELECT
  person_a_id AS parent_id,
  person_b_id AS child_id
FROM relationships
WHERE relationship_type IN ('biological_child', 'adopted_child');

-- Spouse pairs normalised so each person appears in person_id column
CREATE VIEW person_spouses AS
SELECT
  person_a_id   AS person_id,
  person_b_id   AS spouse_id,
  marriage_date,
  divorce_date
FROM relationships
WHERE relationship_type = 'spouse'
UNION ALL
SELECT
  person_b_id,
  person_a_id,
  marriage_date,
  divorce_date
FROM relationships
WHERE relationship_type = 'spouse';
