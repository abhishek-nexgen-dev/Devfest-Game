import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";

export const Participants_Schema = async (): Promise<void> => {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS ${COLLECTIONS.PARTICIPANTS} (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      ticket_id VARCHAR(32) NOT NULL UNIQUE,

      name VARCHAR(150) NOT NULL,

      email VARCHAR(255) NOT NULL,

      mobile_number VARCHAR(20) NOT NULL,

      social_link TEXT NOT NULL,

      profile_image TEXT,

      location VARCHAR(150) NOT NULL,

      track VARCHAR(100),

      github_url TEXT,

      primary_language TEXT[] NOT NULL,

      games JSONB NOT NULL DEFAULT '[]'::jsonb,

      total_points INTEGER NOT NULL DEFAULT 0
        CHECK (total_points >= 0),

      is_certificate_claim BOOLEAN NOT NULL DEFAULT FALSE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Ensure new columns exist if table was created earlier
    ALTER TABLE ${COLLECTIONS.PARTICIPANTS}
      ADD COLUMN IF NOT EXISTS track VARCHAR(100);

    ALTER TABLE ${COLLECTIONS.PARTICIPANTS}
      ADD COLUMN IF NOT EXISTS games JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE ${COLLECTIONS.PARTICIPANTS}
      ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE ${COLLECTIONS.PARTICIPANTS}
      ADD COLUMN IF NOT EXISTS is_certificate_claim BOOLEAN NOT NULL DEFAULT FALSE;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = '${COLLECTIONS.PARTICIPANTS}'
          AND column_name = 'primary_language'
          AND data_type <> 'ARRAY'
      ) THEN
        ALTER TABLE ${COLLECTIONS.PARTICIPANTS}
          ALTER COLUMN primary_language TYPE TEXT[]
          USING ARRAY[primary_language];
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_participants_ticket_id
      ON ${COLLECTIONS.PARTICIPANTS} (ticket_id);

    CREATE INDEX IF NOT EXISTS idx_participants_email
      ON ${COLLECTIONS.PARTICIPANTS} (email);

    CREATE INDEX IF NOT EXISTS idx_participants_mobile_number
      ON ${COLLECTIONS.PARTICIPANTS} (mobile_number);

    CREATE INDEX IF NOT EXISTS idx_participants_total_points
      ON ${COLLECTIONS.PARTICIPANTS} (total_points DESC);

    CREATE INDEX IF NOT EXISTS idx_participants_track
      ON ${COLLECTIONS.PARTICIPANTS} (track);

    -- Validate that each game_id inside participants.games[] references an existing games(id),
    -- automatically look up and attach game_name, default isCompleted/is_completed to false,
    -- default point/points to 0, and keep total_points synchronized
    CREATE OR REPLACE FUNCTION validate_and_sync_participant_games()
    RETURNS TRIGGER AS $$
    DECLARE
      game_item JSONB;
      v_game_id BIGINT;
      v_game_name VARCHAR(150);
      v_is_completed BOOLEAN;
      v_points INTEGER;
      v_calculated_points INTEGER := 0;
      v_updated_games JSONB := '[]'::jsonb;
    BEGIN
      IF NEW.games IS NULL THEN
        NEW.games := '[]'::jsonb;
      END IF;

      IF jsonb_typeof(NEW.games) <> 'array' THEN
        RAISE EXCEPTION 'games column must be a JSON array';
      END IF;

      FOR game_item IN SELECT * FROM jsonb_array_elements(NEW.games)
      LOOP
        IF (game_item->>'game_id') IS NULL THEN
          RAISE EXCEPTION 'Each game entry in participant games array must contain game_id';
        END IF;

        v_game_id := (game_item->>'game_id')::BIGINT;
        v_is_completed := COALESCE(
          (game_item->>'isCompleted')::BOOLEAN,
          (game_item->>'is_completed')::BOOLEAN,
          FALSE
        );
        v_points := COALESCE(
          (game_item->>'Total_game_point')::INTEGER,
          (game_item->>'point')::INTEGER,
          (game_item->>'points')::INTEGER,
          0
        );

        SELECT game_name INTO v_game_name
        FROM ${COLLECTIONS.GAMES}
        WHERE id = v_game_id;

        IF v_game_name IS NULL THEN
          RAISE EXCEPTION 'Foreign key violation: game_id % does not exist in ${COLLECTIONS.GAMES}', v_game_id;
        END IF;

        v_calculated_points := v_calculated_points + v_points;

        -- Auto-attach game_name, and ensure Total_game_point and isCompleted fields are present
        v_updated_games := v_updated_games || jsonb_build_array(
          jsonb_build_object(
            'game_id', v_game_id,
            'game_name', v_game_name,
            'Total_game_point', v_points,
            'isCompleted', v_is_completed,
            'is_completed', v_is_completed,
            'point', v_points,
            'points', v_points
          )
        );
      END LOOP;

      NEW.games := v_updated_games;
      NEW.total_points := v_calculated_points;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_participants_games_fk
      ON ${COLLECTIONS.PARTICIPANTS};

    CREATE TRIGGER trigger_participants_games_fk
      BEFORE INSERT OR UPDATE ON ${COLLECTIONS.PARTICIPANTS}
      FOR EACH ROW
      EXECUTE FUNCTION validate_and_sync_participant_games();

    CREATE OR REPLACE FUNCTION update_participants_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_participants_updated_at
      ON ${COLLECTIONS.PARTICIPANTS};

    CREATE TRIGGER trigger_participants_updated_at
      BEFORE UPDATE ON ${COLLECTIONS.PARTICIPANTS}
      FOR EACH ROW
      EXECUTE FUNCTION update_participants_updated_at();
  `);
};

export default Participants_Schema;
