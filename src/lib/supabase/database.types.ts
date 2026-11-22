export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      assessment_attempts: {
        Row: {
          assessment_id: string;
          child_id: string;
          created_at: string;
          id: string;
          idempotency_key: string;
          is_correct: boolean;
          question_id: string;
          response: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          assessment_id: string;
          child_id: string;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          is_correct: boolean;
          question_id: string;
          response: NonNullable<Json>;
        };
        Update: {
          assessment_id?: string;
          child_id?: string;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          is_correct?: boolean;
          question_id?: string;
          response?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_attempts_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_items: {
        Row: {
          assessment_id: string;
          position: number;
          question_id: string;
        };
        ComputedFields: never;
        Insert: {
          assessment_id: string;
          position: number;
          question_id: string;
        };
        Update: {
          assessment_id?: string;
          position?: number;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_items_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_items_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          created_at: string;
          id: string;
          purpose: string;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          purpose?: string;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          purpose?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: number;
          meta: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: never;
          meta?: NonNullable<Json>;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: never;
          meta?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      child_daily_plans: {
        Row: {
          child_id: string;
          created_at: string;
          lesson_ids: string[];
          plan_date: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          lesson_ids: string[];
          plan_date: string;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          lesson_ids?: string[];
          plan_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "child_daily_plans_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      child_lesson_progress: {
        Row: {
          best_stars: number;
          child_id: string;
          completions: number;
          first_completed_at: string;
          last_completed_at: string;
          last_session_id: string | null;
          lesson_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          best_stars: number;
          child_id: string;
          completions?: number;
          first_completed_at?: string;
          last_completed_at?: string;
          last_session_id?: string | null;
          lesson_id: string;
          updated_at?: string;
        };
        Update: {
          best_stars?: number;
          child_id?: string;
          completions?: number;
          first_completed_at?: string;
          last_completed_at?: string;
          last_session_id?: string | null;
          lesson_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "child_lesson_progress_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_lesson_progress_last_session_id_fkey";
            columns: ["last_session_id"];
            isOneToOne: false;
            referencedRelation: "learning_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      child_rewards: {
        Row: {
          child_id: string;
          granted_at: string;
          id: string;
          reason: string;
          reward_id: string;
          session_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          granted_at?: string;
          id?: string;
          reason: string;
          reward_id: string;
          session_id?: string | null;
        };
        Update: {
          child_id?: string;
          granted_at?: string;
          id?: string;
          reason?: string;
          reward_id?: string;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "child_rewards_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_rewards_reward_id_fkey";
            columns: ["reward_id"];
            isOneToOne: false;
            referencedRelation: "rewards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_rewards_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "learning_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      children: {
        Row: {
          archived_at: string | null;
          avatar_key: string;
          birth_year: number | null;
          created_at: string;
          created_by: string | null;
          family_id: string;
          id: string;
          nickname: string;
          preferences: NonNullable<Json>;
          rewards_seen_at: string | null;
          status: Database["public"]["Enums"]["child_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          avatar_key: string;
          birth_year?: number | null;
          created_at?: string;
          created_by?: string | null;
          family_id: string;
          id?: string;
          nickname: string;
          preferences?: NonNullable<Json>;
          rewards_seen_at?: string | null;
          status?: Database["public"]["Enums"]["child_status"];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          avatar_key?: string;
          birth_year?: number | null;
          created_at?: string;
          created_by?: string | null;
          family_id?: string;
          id?: string;
          nickname?: string;
          preferences?: NonNullable<Json>;
          rewards_seen_at?: string | null;
          status?: Database["public"]["Enums"]["child_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "children_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      content_publication_history: {
        Row: {
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string;
          from_status: Database["public"]["Enums"]["content_status"];
          id: number;
          to_status: Database["public"]["Enums"]["content_status"];
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id: string;
          from_status: Database["public"]["Enums"]["content_status"];
          id?: never;
          to_status: Database["public"]["Enums"]["content_status"];
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          entity_id?: string;
          from_status?: Database["public"]["Enums"]["content_status"];
          id?: never;
          to_status?: Database["public"]["Enums"]["content_status"];
        };
        Relationships: [
          {
            foreignKeyName: "content_publication_history_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      families: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_members: {
        Row: {
          created_at: string;
          family_id: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["family_role"];
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          family_id: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["family_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          family_id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["family_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guardian_consents: {
        Row: {
          consent_version: string;
          consented_at: string;
          family_id: string;
          id: string;
          user_id: string;
          withdrawn_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          consent_version: string;
          consented_at?: string;
          family_id: string;
          id?: string;
          user_id: string;
          withdrawn_at?: string | null;
        };
        Update: {
          consent_version?: string;
          consented_at?: string;
          family_id?: string;
          id?: string;
          user_id?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guardian_consents_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guardian_consents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_sessions: {
        Row: {
          abandoned_at: string | null;
          child_id: string;
          completed_at: string | null;
          correct_count: number;
          current_index: number;
          duration_seconds: number | null;
          first_try_count: number;
          id: string;
          incorrect_count: number;
          lesson_id: string;
          max_score: number;
          score: number;
          stars: number | null;
          started_at: string;
          started_by: string | null;
          status: Database["public"]["Enums"]["session_status"];
          total_questions: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          abandoned_at?: string | null;
          child_id: string;
          completed_at?: string | null;
          correct_count?: number;
          current_index?: number;
          duration_seconds?: never;
          first_try_count?: number;
          id?: string;
          incorrect_count?: number;
          lesson_id: string;
          max_score?: number;
          score?: number;
          stars?: number | null;
          started_at?: string;
          started_by?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          total_questions: number;
          updated_at?: string;
        };
        Update: {
          abandoned_at?: string | null;
          child_id?: string;
          completed_at?: string | null;
          correct_count?: number;
          current_index?: number;
          duration_seconds?: never;
          first_try_count?: number;
          id?: string;
          incorrect_count?: number;
          lesson_id?: string;
          max_score?: number;
          score?: number;
          stars?: number | null;
          started_at?: string;
          started_by?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          total_questions?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_sessions_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_sessions_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_sessions_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_questions: {
        Row: {
          lesson_id: string;
          position: number;
          question_id: string;
        };
        ComputedFields: never;
        Insert: {
          lesson_id: string;
          position: number;
          question_id: string;
        };
        Update: {
          lesson_id?: string;
          position?: number;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          cover: NonNullable<Json>;
          created_at: string;
          id: string;
          minutes: number;
          objective_vi: string;
          published_at: string | null;
          skill_id: string;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cover: NonNullable<Json>;
          created_at?: string;
          id?: string;
          minutes?: number;
          objective_vi?: string;
          published_at?: string | null;
          skill_id: string;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at?: string;
        };
        Update: {
          cover?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          minutes?: number;
          objective_vi?: string;
          published_at?: string | null;
          skill_id?: string;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          illustration: string;
          published_at: string | null;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title_en: string;
          title_vi: string;
          tone: string;
          unlock_min_completed_lessons: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          illustration: string;
          published_at?: string | null;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_en?: string;
          title_vi: string;
          tone: string;
          unlock_min_completed_lessons?: number | null;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          illustration?: string;
          published_at?: string | null;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_en?: string;
          title_vi?: string;
          tone?: string;
          unlock_min_completed_lessons?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          locale: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          locale?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          locale?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_attempts: {
        Row: {
          attempt_no: number;
          child_id: string;
          created_at: string;
          feedback_text: string;
          id: string;
          idempotency_key: string;
          is_correct: boolean;
          is_final: boolean;
          max_score: number;
          question_id: string;
          response: NonNullable<Json>;
          score: number;
          session_id: string;
          skill_id: string;
        };
        ComputedFields: never;
        Insert: {
          attempt_no: number;
          child_id: string;
          created_at?: string;
          feedback_text: string;
          id?: string;
          idempotency_key: string;
          is_correct: boolean;
          is_final: boolean;
          max_score: number;
          question_id: string;
          response: NonNullable<Json>;
          score: number;
          session_id: string;
          skill_id: string;
        };
        Update: {
          attempt_no?: number;
          child_id?: string;
          created_at?: string;
          feedback_text?: string;
          id?: string;
          idempotency_key?: string;
          is_correct?: boolean;
          is_final?: boolean;
          max_score?: number;
          question_id?: string;
          response?: NonNullable<Json>;
          score?: number;
          session_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_attempts_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "learning_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_attempts_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          config: NonNullable<Json>;
          created_at: string;
          difficulty: number;
          feedback: Json | null;
          id: string;
          instruction_audio_url: string | null;
          max_attempts: number;
          memorize: Json | null;
          prompt_vi: string;
          published_at: string | null;
          skill_id: string;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          stimulus: Json | null;
          type: Database["public"]["Enums"]["question_type"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          config: NonNullable<Json>;
          created_at?: string;
          difficulty: number;
          feedback?: Json | null;
          id?: string;
          instruction_audio_url?: string | null;
          max_attempts?: number;
          memorize?: Json | null;
          prompt_vi: string;
          published_at?: string | null;
          skill_id: string;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          stimulus?: Json | null;
          type: Database["public"]["Enums"]["question_type"];
          updated_at?: string;
        };
        Update: {
          config?: NonNullable<Json>;
          created_at?: string;
          difficulty?: number;
          feedback?: Json | null;
          id?: string;
          instruction_audio_url?: string | null;
          max_attempts?: number;
          memorize?: Json | null;
          prompt_vi?: string;
          published_at?: string | null;
          skill_id?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          stimulus?: Json | null;
          type?: Database["public"]["Enums"]["question_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      rewards: {
        Row: {
          created_at: string;
          criteria_vi: string;
          id: string;
          illustration: string;
          key: string;
          kind: Database["public"]["Enums"]["reward_kind"];
          published_at: string | null;
          rule: NonNullable<Json>;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title_en: string;
          title_vi: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          criteria_vi?: string;
          id?: string;
          illustration: string;
          key: string;
          kind?: Database["public"]["Enums"]["reward_kind"];
          published_at?: string | null;
          rule: NonNullable<Json>;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_en?: string;
          title_vi: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          criteria_vi?: string;
          id?: string;
          illustration?: string;
          key?: string;
          kind?: Database["public"]["Enums"]["reward_kind"];
          published_at?: string | null;
          rule?: NonNullable<Json>;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_en?: string;
          title_vi?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_mastery: {
        Row: {
          accuracy: number;
          child_id: string;
          distinct_questions: number;
          evidence_count: number;
          last_practiced_at: string | null;
          mastered_at: string | null;
          session_count: number;
          skill_id: string;
          state: Database["public"]["Enums"]["mastery_state"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accuracy?: number;
          child_id: string;
          distinct_questions?: number;
          evidence_count?: number;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          session_count?: number;
          skill_id: string;
          state?: Database["public"]["Enums"]["mastery_state"];
          updated_at?: string;
        };
        Update: {
          accuracy?: number;
          child_id?: string;
          distinct_questions?: number;
          evidence_count?: number;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          session_count?: number;
          skill_id?: string;
          state?: Database["public"]["Enums"]["mastery_state"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_mastery_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skill_mastery_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          created_at: string;
          id: string;
          module_id: string;
          published_at: string | null;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          module_id: string;
          published_at?: string | null;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module_id?: string;
          published_at?: string | null;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title_vi?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skills_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["staff_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: Database["public"]["Enums"]["staff_role"];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["staff_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_roles_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      child_module_progress: {
        Row: {
          child_id: string;
          completed_lessons: number | null;
          last_completed_at: string | null;
          module_id: string;
          stars: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "child_lesson_progress_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skills_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      abandon_session: { Args: { p_session_id: string }; Returns: undefined };
      archive_child: { Args: { p_child_id: string }; Returns: undefined };
      complete_session: { Args: { p_session_id: string }; Returns: Json };
      create_child: {
        Args: {
          p_avatar_key: string;
          p_birth_year?: number;
          p_family_id: string;
          p_nickname: string;
          p_preferences?: Json;
        };
        Returns: string;
      };
      create_family: {
        Args: { p_consent_version: string; p_display_name: string };
        Returns: string;
      };
      ensure_daily_plan: {
        Args: {
          p_child_id: string;
          p_lesson_slugs: string[];
          p_plan_date: string;
        };
        Returns: string[];
      };
      get_active_session: {
        Args: { p_child_id: string; p_lesson_slug: string };
        Returns: Json;
      };
      get_session_result: { Args: { p_session_id: string }; Returns: Json };
      get_session_state: { Args: { p_session_id: string }; Returns: Json };
      get_student_overview: { Args: { p_child_id: string }; Returns: Json };
      grant_staff_role: {
        Args: {
          p_role: Database["public"]["Enums"]["staff_role"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      request_hint: {
        Args: { p_question_slug: string; p_session_id: string };
        Returns: Json;
      };
      revoke_staff_role: {
        Args: {
          p_role: Database["public"]["Enums"]["staff_role"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      set_content_status: {
        Args: {
          p_entity: string;
          p_id: string;
          p_status: Database["public"]["Enums"]["content_status"];
        };
        Returns: undefined;
      };
      start_session: {
        Args: {
          p_child_id: string;
          p_lesson_slug: string;
          p_restart?: boolean;
        };
        Returns: Json;
      };
      submit_attempt: {
        Args: {
          p_idempotency_key: string;
          p_question_slug: string;
          p_response: Json;
          p_session_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      child_status: "active" | "archived";
      content_status: "draft" | "in_review" | "published" | "archived";
      family_role: "owner" | "guardian";
      mastery_state:
        "not_started" | "learning" | "practicing" | "mastered" | "review";
      membership_status: "active" | "invited" | "removed";
      question_type:
        | "single_choice"
        | "image_choice"
        | "matching"
        | "ordering"
        | "pattern"
        | "memory";
      reward_kind: "badge" | "sticker" | "real_world";
      session_status: "in_progress" | "completed" | "abandoned";
      staff_role: "content_editor" | "content_reviewer" | "publisher" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      child_status: ["active", "archived"],
      content_status: ["draft", "in_review", "published", "archived"],
      family_role: ["owner", "guardian"],
      mastery_state: [
        "not_started",
        "learning",
        "practicing",
        "mastered",
        "review",
      ],
      membership_status: ["active", "invited", "removed"],
      question_type: [
        "single_choice",
        "image_choice",
        "matching",
        "ordering",
        "pattern",
        "memory",
      ],
      reward_kind: ["badge", "sticker", "real_world"],
      session_status: ["in_progress", "completed", "abandoned"],
      staff_role: ["content_editor", "content_reviewer", "publisher", "admin"],
    },
  },
} as const;
