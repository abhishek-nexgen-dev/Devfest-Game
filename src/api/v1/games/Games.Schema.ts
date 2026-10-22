import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";

export const Games_Schema = async (): Promise<void> => {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS ${COLLECTIONS.GAMES} (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      game_name VARCHAR(150) NOT NULL UNIQUE,

      description TEXT,

      max_score INTEGER NOT NULL DEFAULT 100
        CHECK (max_score >= 0),

      registrations INTEGER NOT NULL DEFAULT 0
        CHECK (registrations >= 0),

      submissions INTEGER NOT NULL DEFAULT 0
        CHECK (submissions >= 0),

      start_time TIMESTAMPTZ NOT NULL,

      end_time TIMESTAMPTZ NOT NULL,

      status VARCHAR(32) NOT NULL DEFAULT 'UPCOMING'
        CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED')),

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CHECK (end_time > start_time)
    );

    ALTER TABLE ${COLLECTIONS.GAMES}
      DROP CONSTRAINT IF EXISTS games_status_check;

    ALTER TABLE ${COLLECTIONS.GAMES}
      ADD CONSTRAINT games_status_check
      CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED'));

    ALTER TABLE ${COLLECTIONS.GAMES}
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(128)
      REFERENCES ${COLLECTIONS.USERS}(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_games_created_by
      ON ${COLLECTIONS.GAMES} (created_by);

    CREATE INDEX IF NOT EXISTS idx_games_status
      ON ${COLLECTIONS.GAMES} (status);

    CREATE INDEX IF NOT EXISTS idx_games_game_name
      ON ${COLLECTIONS.GAMES} (game_name);

    CREATE OR REPLACE FUNCTION update_games_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_games_updated_at
      ON ${COLLECTIONS.GAMES};

    CREATE TRIGGER trigger_games_updated_at
      BEFORE UPDATE ON ${COLLECTIONS.GAMES}
      FOR EACH ROW
      EXECUTE FUNCTION update_games_updated_at();

    -- Enable Row Level Security (RLS) for Supabase Security Compliance
    ALTER TABLE ${COLLECTIONS.GAMES} ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "allow_public_select_games" ON ${COLLECTIONS.GAMES};
    CREATE POLICY "allow_public_select_games" ON ${COLLECTIONS.GAMES}
      FOR SELECT
      TO public
      USING (true);

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        DROP POLICY IF EXISTS "service_role_games_all" ON ${COLLECTIONS.GAMES};
        CREATE POLICY "service_role_games_all" ON ${COLLECTIONS.GAMES}
          FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);
};

export default Games_Schema;
