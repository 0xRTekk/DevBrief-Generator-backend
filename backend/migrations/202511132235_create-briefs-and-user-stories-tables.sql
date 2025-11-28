-- Ensure required enums exist (safe to rerun)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_level') THEN
    CREATE TYPE brief_level AS ENUM ('junior', 'intermediate', 'senior');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_tech_focus') THEN
    CREATE TYPE brief_tech_focus AS ENUM ('frontend', 'backend', 'fullstack');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_company_size') THEN
    CREATE TYPE brief_company_size AS ENUM ('Startup', 'SME', 'Large Enterprise');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_story_priority') THEN
    CREATE TYPE user_story_priority AS ENUM ('high', 'medium', 'low');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'story_complexity') THEN
    CREATE TYPE story_complexity AS ENUM ('low', 'medium', 'high');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Main brief table
CREATE TABLE IF NOT EXISTS briefs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level             brief_level        NOT NULL,
  domain            text               NOT NULL,
  tech_focus        brief_tech_focus   NOT NULL,
  stack             text[]             NOT NULL CHECK (cardinality(stack) >= 1),
  duration          text               NOT NULL,
  brief             text               NOT NULL,
  business_problem  text               NOT NULL,
  target_users      text               NOT NULL,
  goals             text[]             NOT NULL CHECK (cardinality(goals) >= 1),
  deliverables      text[]             NOT NULL CHECK (cardinality(deliverables) >= 1),
  assessment_criteria text             NOT NULL,
  company_size      brief_company_size NOT NULL,
  complexity        story_complexity   NOT NULL,
  created_at        timestamptz        NOT NULL DEFAULT now()
);

-- User stories table (exactly three per brief, highest priority first)
CREATE TABLE IF NOT EXISTS brief_user_stories (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id            uuid               NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  story_order         smallint           NOT NULL CHECK (story_order BETWEEN 1 AND 3),
  title               text               NOT NULL,
  description         text               NOT NULL,
  acceptance_criteria text[]             NOT NULL CHECK (cardinality(acceptance_criteria) >= 1),
  priority            user_story_priority NOT NULL,
  complexity          story_complexity    NOT NULL,
  CONSTRAINT unique_story_per_order UNIQUE (brief_id, story_order)
);

-- Optional: quick lookup index for stories
CREATE INDEX IF NOT EXISTS idx_brief_user_stories_brief
  ON brief_user_stories (brief_id);