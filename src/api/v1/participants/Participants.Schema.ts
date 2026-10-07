
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";




 const Participants_Schema = async (): Promise<void> => {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS ${COLLECTIONS.PARTICIPANTS} (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      ticket_id VARCHAR(32) NOT NULL UNIQUE,

      name VARCHAR(150) NOT NULL,

      email VARCHAR(255) NOT NULL,

      mobile_number VARCHAR(20) NOT NULL,

      social_link TEXT,

      profile_image TEXT,

      location VARCHAR(150) NOT NULL,

      github_url TEXT,

      primary_language VARCHAR(100) NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_participants_ticket_id
      ON ${COLLECTIONS.PARTICIPANTS} (ticket_id);

    CREATE INDEX IF NOT EXISTS idx_participants_email
      ON ${COLLECTIONS.PARTICIPANTS} (email);

    CREATE INDEX IF NOT EXISTS idx_participants_mobile_number
      ON ${COLLECTIONS.PARTICIPANTS} (mobile_number);

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
