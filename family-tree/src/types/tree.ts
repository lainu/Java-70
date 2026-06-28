export interface House {
  id: string;
  name_en: string;
  name_ml: string | null;
  location: string | null;
  description: string | null;
  cover_photo: string | null;
}

export interface Person {
  id: string;
  name_en: string;
  name_ml: string | null;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birth_date: string | null;
  birth_date_approx: boolean;
  death_date: string | null;
  is_alive: boolean;
  biography_en: string | null;
  biography_ml: string | null;
  profile_photo: string | null;
  house_id: string | null;
  generation_number: number | null;
  is_root: boolean;
  created_at: string;
}

export interface Relationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: 'spouse' | 'biological_child' | 'adopted_child';
  marriage_date: string | null;
  divorce_date: string | null;
}

export interface FamilyTreeData {
  persons: Person[];
  relationships: Relationship[];
  houses: House[];
}

export interface TreeFilters {
  houseId: string | null;
  focusPersonId: string | null;
}

import type { Json } from './database';

export type ChangeType = 'add_person' | 'edit_person' | 'add_relationship' | 'remove_relationship';
export type ChangeStatus = 'pending' | 'approved' | 'rejected';

export interface PendingChange {
  id: string;
  change_type: ChangeType;
  status: ChangeStatus;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  target_person_id: string | null;
  payload: Json;
  relationship_payload: Json | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  person_id: string | null;
}

export interface Invite {
  id: string;
  token: string;
  email: string | null;
  created_by: string;
  used_by: string | null;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}
