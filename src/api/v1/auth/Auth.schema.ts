import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";

export const AuthSchema = async (): Promise<void> => {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS ${COLLECTIONS.USERS} (
      id VARCHAR(128) PRIMARY KEY,

      name VARCHAR(150) NOT NULL,

      email VARCHAR(255) NOT NULL UNIQUE,

      password_hash TEXT NOT NULL,

      role VARCHAR(32) NOT NULL
        CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),

      department VARCHAR(100) DEFAULT 'Operations',

      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'DISABLED')),

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE ${COLLECTIONS.USERS}
      ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Operations';

    CREATE INDEX IF NOT EXISTS idx_users_role
      ON ${COLLECTIONS.USERS} (role);

    CREATE INDEX IF NOT EXISTS idx_users_status
      ON ${COLLECTIONS.USERS} (status);

    CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_users_updated_at
      ON ${COLLECTIONS.USERS};

    CREATE TRIGGER trigger_users_updated_at
      BEFORE UPDATE ON ${COLLECTIONS.USERS}
      FOR EACH ROW
      EXECUTE FUNCTION update_users_updated_at();

    -- Enable Row Level Security (RLS) for Supabase Security Compliance
    ALTER TABLE ${COLLECTIONS.USERS} ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        DROP POLICY IF EXISTS "service_role_users_all" ON ${COLLECTIONS.USERS};
        CREATE POLICY "service_role_users_all" ON ${COLLECTIONS.USERS}
          FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);
};

export default AuthSchema;
