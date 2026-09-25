/**
 * Hand-maintained Supabase types that mirror supabase/migrations/0001_questnest_init.sql.
 * Regenerate with `supabase gen types typescript` once the CLI is linked, if preferred.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Recurrence = "once" | "daily" | "weekly" | "custom";
export type CompletionStatus = "pending" | "approved" | "rejected" | "excused";
export type RedemptionStatus = "pending" | "approved" | "rejected" | "fulfilled";
export type TxKind = "chore" | "reward" | "refund" | "bonus" | "penalty" | "adjustment";
export type MemberRole = "owner" | "parent";

type Row<T> = T;
type Insert<T, Optional extends keyof T = never, Omitted extends keyof T = never> = Omit<
  Partial<Pick<T, Optional>> & Omit<T, Optional | Omitted>,
  never
>;

export type EquippedStyle = {
  title?: string | null;
  frame?: string | null;
  sticker?: string | null;
  hat?: string | null;
  aura?: string | null;
  nameplate?: string | null;
  banner?: string | null;
  room?: string | null;
  soundPack?: string | null;
  confetti?: string | null;
  showcase?: string[] | null;
  savingFor?: string | null;
};

/** Nest-wide look, stored in families.style (0009). */
export type FamilyStyle = {
  room?: string | null;
  sky?: "clear" | "rainy" | "snowy" | null;
  seasonalStickers?: boolean;
  lockedSlots?: string[];
  crestEmoji?: string | null;
  crestColor?: string | null;
  /** Nest-owner Closet look when profiles.avatar_key / motto are missing (pre-0007). */
  ownerLook?: {
    motto?: string | null;
    avatarKey?: string | null;
    colorKey?: string | null;
  } | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_key?: string | null;
  color_key?: string | null;
  motto?: string | null;
  style?: EquippedStyle | null;
  created_at: string;
}

export type Family = {
  id: string;
  name: string;
  owner_id: string;
  currency_name: string;
  currency_emoji: string;
  timezone: string;
  location_city: string | null;
  location_state: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_radius_miles: number;
  style?: FamilyStyle | null;
  daily_bonus_points?: number | null;
  combo_bonus_points?: number | null;
  surprise_chance?: number | null;
  perfect_day_points?: number | null;
  created_at: string;
}

export type FamilyMember = {
  family_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export type Child = {
  id: string;
  family_id: string;
  name: string;
  avatar: string;
  color: string;
  points_balance: number;
  lifetime_points: number;
  closet_points?: number;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  sort_order: number;
  is_active: boolean;
  nickname?: string | null;
  motto?: string | null;
  style?: EquippedStyle | null;
  cheer?: string | null;
  created_at: string;
}

export type ChildKudos = {
  id: string;
  family_id: string;
  child_id: string;
  emoji: string;
  message: string | null;
  created_by: string | null;
  created_at: string;
}

export type ChildUnlockGift = {
  family_id: string;
  child_id: string;
  item_key: string;
  created_at: string;
}

export type DayAwardKind = "daily" | "perfect_day" | "mystery" | "comeback" | "combo";

export type ChildDayAward = {
  family_id: string;
  child_id: string;
  for_date: string;
  kind: DayAwardKind | string;
  points: number;
  created_at: string;
}

export type ParentProfile = {
  id: string;
  family_id: string;
  name: string;
  avatar: string;
  color: string;
  motto: string | null;
  sort_order: number;
  created_at: string;
}

export type FamilyMilestone = {
  id: string;
  family_id: string;
  lifetime_points: number;
  title: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export type Chore = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  icon: string;
  points: number;
  recurrence: Recurrence;
  days_of_week: number[];
  requires_approval: boolean;
  is_active: boolean;
  kind?: string | null;
  /** First kid to tap Done keeps it for the day. Others cannot claim it that date. */
  single_claim?: boolean | null;
  /** Miss a due day and the assigned kid loses this quest's points. */
  mandatory?: boolean | null;
  /** Kids can tap “Can't do this today” and a parent confirms the skip. */
  allow_skip?: boolean | null;
  created_at: string;
  updated_at: string;
}

export type ChoreMissPenalty = {
  id: string;
  family_id: string;
  child_id: string;
  chore_id: string;
  for_date: string;
  points: number;
  created_at: string;
};

export type ChoreAssignment = {
  chore_id: string;
  child_id: string;
}

export type ChoreCompletion = {
  id: string;
  family_id: string;
  chore_id: string;
  child_id: string;
  for_date: string;
  status: CompletionStatus;
  points_awarded: number | null;
  note: string | null;
  completed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  /** True when this row is a “can't do this today” request, not a Done tap. */
  excuse?: boolean | null;
}

export type Reward = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  icon: string;
  cost: number;
  stock: number | null;
  category: string;
  requires_approval: boolean;
  is_active: boolean;
  source_key: string | null;
  rarity?: string | null;
  created_at: string;
  updated_at: string;
}

export type RewardAssignment = {
  reward_id: string;
  child_id: string;
}

export type RewardRedemption = {
  id: string;
  family_id: string;
  reward_id: string;
  child_id: string;
  status: RedemptionStatus;
  cost_at_time: number;
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export type PointTransaction = {
  id: string;
  family_id: string;
  child_id: string;
  amount: number;
  kind: TxKind;
  ref_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export type ChildBadge = {
  child_id: string;
  badge_key: string;
  earned_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>;
        Insert: Insert<Profile, "display_name" | "avatar_url" | "created_at">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      families: {
        Row: Row<Family>;
        Insert: Insert<
          Family,
          | "id"
          | "currency_name"
          | "currency_emoji"
          | "timezone"
          | "location_city"
          | "location_state"
          | "location_lat"
          | "location_lng"
          | "location_radius_miles"
          | "created_at"
        >;
        Update: Partial<Family>;
        Relationships: [];
      };
      family_members: {
        Row: Row<FamilyMember>;
        Insert: Insert<FamilyMember, "role" | "created_at">;
        Update: Partial<FamilyMember>;
        Relationships: [];
      };
      children: {
        Row: Row<Child>;
        Insert: Insert<
          Child,
          | "id"
          | "avatar"
          | "color"
          | "points_balance"
          | "lifetime_points"
          | "closet_points"
          | "current_streak"
          | "longest_streak"
          | "last_streak_date"
          | "sort_order"
          | "is_active"
          | "nickname"
          | "motto"
          | "style"
          | "created_at"
        >;
        Update: Partial<Child>;
        Relationships: [];
      };
      chores: {
        Row: Row<Chore>;
        Insert: Insert<
          Chore,
          | "id"
          | "description"
          | "icon"
          | "recurrence"
          | "days_of_week"
          | "requires_approval"
          | "is_active"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<Chore>;
        Relationships: [];
      };
      chore_assignments: {
        Row: Row<ChoreAssignment>;
        Insert: ChoreAssignment;
        Update: Partial<ChoreAssignment>;
        Relationships: [];
      };
      chore_completions: {
        Row: Row<ChoreCompletion>;
        Insert: Insert<
          ChoreCompletion,
          | "id"
          | "for_date"
          | "status"
          | "points_awarded"
          | "note"
          | "completed_at"
          | "reviewed_at"
          | "reviewed_by"
        >;
        Update: Partial<ChoreCompletion>;
        Relationships: [];
      };
      rewards: {
        Row: Row<Reward>;
        Insert: Insert<
          Reward,
          | "id"
          | "description"
          | "icon"
          | "stock"
          | "category"
          | "requires_approval"
          | "is_active"
          | "source_key"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<Reward>;
        Relationships: [];
      };
      reward_assignments: {
        Row: Row<RewardAssignment>;
        Insert: RewardAssignment;
        Update: Partial<RewardAssignment>;
        Relationships: [];
      };
      reward_redemptions: {
        Row: Row<RewardRedemption>;
        Insert: Insert<
          RewardRedemption,
          "id" | "status" | "requested_at" | "resolved_at" | "resolved_by"
        >;
        Update: Partial<RewardRedemption>;
        Relationships: [];
      };
      point_transactions: {
        Row: Row<PointTransaction>;
        Insert: Insert<
          PointTransaction,
          "id" | "ref_id" | "note" | "created_by" | "created_at"
        >;
        Update: Partial<PointTransaction>;
        Relationships: [];
      };
      child_badges: {
        Row: Row<ChildBadge>;
        Insert: Insert<ChildBadge, "earned_at">;
        Update: Partial<ChildBadge>;
        Relationships: [];
      };
      family_milestones: {
        Row: Row<FamilyMilestone>;
        Insert: Insert<FamilyMilestone, "id" | "is_active" | "created_at" | "icon">;
        Update: Partial<FamilyMilestone>;
        Relationships: [];
      };
      parent_profiles: {
        Row: Row<ParentProfile>;
        Insert: Insert<ParentProfile, "id" | "avatar" | "color" | "motto" | "sort_order" | "created_at">;
        Update: Partial<ParentProfile>;
        Relationships: [];
      };
      child_kudos: {
        Row: Row<ChildKudos>;
        Insert: Insert<ChildKudos, "id" | "message" | "created_by" | "created_at">;
        Update: Partial<ChildKudos>;
        Relationships: [];
      };
      child_unlock_gifts: {
        Row: Row<ChildUnlockGift>;
        Insert: Insert<ChildUnlockGift, "created_at">;
        Update: Partial<ChildUnlockGift>;
        Relationships: [];
      };
      child_day_awards: {
        Row: Row<ChildDayAward>;
        Insert: Insert<ChildDayAward, "created_at" | "points">;
        Update: Partial<ChildDayAward>;
        Relationships: [];
      };
      chore_miss_penalties: {
        Row: Row<ChoreMissPenalty>;
        Insert: Insert<ChoreMissPenalty, "id" | "created_at">;
        Update: Partial<ChoreMissPenalty>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_child_pin: { Args: { p_child: string; p_pin: string }; Returns: undefined };
      verify_child_pin: { Args: { p_child: string; p_pin: string }; Returns: boolean };
      set_parent_pin: { Args: { p_family: string; p_pin: string }; Returns: undefined };
      verify_parent_pin: { Args: { p_family: string; p_pin: string }; Returns: boolean };
      has_parent_pin: { Args: { p_family: string }; Returns: boolean };
      set_parent_profile_pin: { Args: { p_parent: string; p_pin: string }; Returns: undefined };
      verify_parent_profile_pin: { Args: { p_parent: string; p_pin: string }; Returns: boolean };
      complete_chore: {
        Args: { p_chore: string; p_child: string; p_date?: string };
        Returns: ChoreCompletion;
      };
      review_completion: {
        Args: { p_completion: string; p_approve: boolean; p_points?: number | null };
        Returns: ChoreCompletion;
      };
      redeem_reward: {
        Args: { p_reward: string; p_child: string; p_cost?: number | null };
        Returns: RewardRedemption;
      };
      resolve_redemption: {
        Args: { p_redemption: string; p_action: "approve" | "reject" | "fulfill" | "cancel" };
        Returns: RewardRedemption;
      };
      adjust_points: {
        Args: { p_child: string; p_amount: number; p_note?: string | null };
        Returns: PointTransaction;
      };
      settle_mandatory_penalties: {
        Args: { p_family: string; p_through: string };
        Returns: number;
      };
      buy_closet_item: {
        Args: { p_child: string; p_item_key: string; p_cost: number };
        Returns: number;
      };
      erase_activity: {
        Args: { p_tx: string };
        Returns: undefined;
      };
    };
    Enums: {
      recurrence: Recurrence;
      completion_status: CompletionStatus;
      redemption_status: RedemptionStatus;
      tx_kind: TxKind;
      member_role: MemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
