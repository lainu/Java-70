-- Core tables

-- Family branch / house entities (e.g. "Thattakunnel family, Thiruvalla, Kerala")
CREATE TABLE houses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en      TEXT NOT NULL,
  name_ml      TEXT,
  location     TEXT,
  description  TEXT,
  cover_photo  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id)
);

-- Family members
CREATE TABLE persons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en             TEXT NOT NULL,
  name_ml             TEXT,
  gender              gender_enum NOT NULL DEFAULT 'unknown',
  birth_date          DATE,
  birth_date_approx   BOOLEAN NOT NULL DEFAULT false,
  death_date          DATE,
  is_alive            BOOLEAN NOT NULL DEFAULT true,
  biography_en        TEXT,
  biography_ml        TEXT,
  profile_photo       TEXT,
  house_id            UUID REFERENCES houses(id) ON DELETE SET NULL,
  generation_number   INT,
  is_root             BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES auth.users(id),
  approved_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persons_house_id ON persons(house_id);
CREATE INDEX idx_persons_generation ON persons(generation_number);

-- Relationship graph edges
-- For parent-child: person_a = parent, person_b = child
-- For spouse: person_a and person_b are spouses
CREATE TABLE relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_a_id       UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  person_b_id       UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type relationship_type_enum NOT NULL,
  marriage_date     DATE,
  divorce_date      DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_relationship CHECK (person_a_id <> person_b_id),
  CONSTRAINT unique_relationship UNIQUE (person_a_id, person_b_id, relationship_type)
);

CREATE INDEX idx_rel_person_a ON relationships(person_a_id);
CREATE INDEX idx_rel_person_b ON relationships(person_b_id);

-- Invite tokens for registration
CREATE TABLE invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  used_by     UUID REFERENCES auth.users(id),
  status      invite_status_enum NOT NULL DEFAULT 'pending',
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extended user profiles (linked to Supabase Auth)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  person_id     UUID REFERENCES persons(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pending member submissions awaiting admin approval
CREATE TABLE pending_changes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type           change_type_enum NOT NULL,
  status                change_status_enum NOT NULL DEFAULT 'pending',
  submitted_by          UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  target_person_id      UUID REFERENCES persons(id) ON DELETE CASCADE,
  payload               JSONB NOT NULL,
  relationship_payload  JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_status ON pending_changes(status);
CREATE INDEX idx_pending_submitted_by ON pending_changes(submitted_by);
