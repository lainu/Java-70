-- Enums used across the schema

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'unknown');

CREATE TYPE change_type_enum AS ENUM (
  'add_person',
  'edit_person',
  'add_relationship',
  'remove_relationship'
);

CREATE TYPE change_status_enum AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE relationship_type_enum AS ENUM (
  'spouse',
  'biological_child',
  'adopted_child'
);

CREATE TYPE invite_status_enum AS ENUM ('pending', 'used', 'expired', 'revoked');
