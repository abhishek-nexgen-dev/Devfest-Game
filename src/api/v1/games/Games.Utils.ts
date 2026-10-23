import { COLLECTIONS } from "../../../constants/collections";
import pg from "../../../core/database/postgres";
import { GameType } from "./Game.Type";
import { createGame_Type, updateGame_Type, gameQuery_Type } from "./Games.validation";

class GameUtils {
  isGameExist = async (gameName: string): Promise<boolean> => {
    if (!gameName) return false;
    const query = `SELECT EXISTS (SELECT 1 FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1));`;
    const result = await pg.query<{ exists: boolean }>(query, [gameName.trim()]);
    return result.rows[0].exists;
  };

  isGameExistById = async (id: string | number): Promise<boolean> => {
    if (!id) return false;
    const isNumeric = !isNaN(Number(id));
    if (isNumeric) {
      const query = `SELECT EXISTS (SELECT 1 FROM ${COLLECTIONS.GAMES} WHERE id = $1::bigint);`;
      const result = await pg.query<{ exists: boolean }>(query, [id]);
      return result.rows[0].exists;
    }
    const query = `SELECT EXISTS (SELECT 1 FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1));`;
    const result = await pg.query<{ exists: boolean }>(query, [String(id).trim()]);
    return result.rows[0].exists;
  };

  FIND_PAGINATED_GAMES = async (query: gameQuery_Type) => {
    const conditions: string[] = [];
    const values: any[] = [];

    // Search filter across game_name, description, tagline, venue
    if (query.search && query.search.trim()) {
      values.push(`%${query.search.trim()}%`);
      conditions.push(
        `(game_name ILIKE $${values.length} OR description ILIKE $${values.length} OR tagline ILIKE $${values.length} OR venue ILIKE $${values.length})`,
      );
    }

    // Format / Game Type filter
    const effectiveType = query.type || query.game_type;
    if (effectiveType && effectiveType !== "ALL") {
      values.push(effectiveType);
      conditions.push(`game_type = $${values.length}::varchar`);
    }

    // Status filter
    if (query.status && query.status !== "ALL") {
      values.push(query.status);
      conditions.push(`status = $${values.length}::varchar`);
    }

    // Track filter
    if (query.track && query.track !== "ALL") {
      values.push(query.track);
      conditions.push(`track = $${values.length}::varchar`);
    }

    // Completion status filter
    if (query.is_completed !== undefined) {
      values.push(query.is_completed);
      conditions.push(`is_completed = $${values.length}::boolean`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Total matching count query
    const countSql = `SELECT COUNT(*)::integer AS total FROM ${COLLECTIONS.GAMES} ${whereClause};`;
    const countResult = await pg.query<{ total: number }>(countSql, values);
    const total = Number(countResult.rows[0]?.total || 0);

    // 2. Sorting
    const validSortColumns: Record<string, string> = {
      id: "id",
      game_name: "game_name",
      max_score: "max_score",
      registrations: "registrations",
      submissions: "submissions",
      start_time: "start_time",
      end_time: "end_time",
      status: "status",
      game_type: "game_type",
      track: "track",
      created_at: "created_at",
    };
    const sortBy = validSortColumns[query.sort_by || "id"] || "id";
    const sortOrder = (query.order || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

    // 3. Pagination clause
    const fetchValues = [...values];
    let paginationClause = "";

    const page = Math.max(1, query.page || 1);
    const limit = query.all ? total || 1 : Math.max(1, Math.min(100, query.limit || 10));

    if (!query.all) {
      const offset = (page - 1) * limit;

      fetchValues.push(limit);
      const limitIdx = fetchValues.length;
      fetchValues.push(offset);
      const offsetIdx = fetchValues.length;

      paginationClause = `LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    }

    const dataSql = `
      SELECT *
      FROM ${COLLECTIONS.GAMES}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      ${paginationClause};
    `;

    const dataResult = await pg.query<GameType>(dataSql, fetchValues);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      rows: dataResult.rows,
      pagination: {
        total,
        page: query.all ? 1 : page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  };

  FIND_ALL_GAMES = (filters?: { type?: string; status?: string }) => {
    return this.FIND_PAGINATED_GAMES({
      page: 1,
      limit: 100,
      sort_by: "id",
      order: "ASC",
      all: true,
      type: filters?.type,
      status: filters?.status,
    } as gameQuery_Type);
  };

  FIND_GAME_BY_ID = (id: string | number) => {
    const isNumeric = !isNaN(Number(id));
    if (isNumeric) {
      return pg.query<GameType>(`SELECT * FROM ${COLLECTIONS.GAMES} WHERE id = $1::bigint LIMIT 1;`, [
        id,
      ]);
    }
    return pg.query<GameType>(
      `SELECT * FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1) LIMIT 1;`,
      [String(id).trim()],
    );
  };

  FIND_GAME_BY_NAME = (gameName: string) => {
    return pg.query<GameType>(
      `SELECT * FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1) LIMIT 1;`,
      [gameName.trim()],
    );
  };

  CREATE_GAME = (data: createGame_Type) => {
    const customId =
      data.id !== undefined && data.id !== null && !isNaN(Number(data.id))
        ? Number(data.id)
        : null;

    if (customId) {
      return pg.query<GameType>(
        `
        INSERT INTO ${COLLECTIONS.GAMES} (
          id,
          game_name,
          description,
          max_score,
          registrations,
          submissions,
          start_time,
          end_time,
          status,
          game_type,
          is_completed,
          tagline,
          track,
          venue,
          rules,
          created_by
        ) OVERRIDING SYSTEM VALUE VALUES (
          $1::bigint,
          $2::varchar,
          $3::text,
          $4::integer,
          $5::integer,
          $6::integer,
          $7::timestamptz,
          $8::timestamptz,
          $9::varchar,
          $10::varchar,
          $11::boolean,
          $12::varchar,
          $13::varchar,
          $14::varchar,
          $15::text,
          $16::varchar
        )
        ON CONFLICT (id) DO UPDATE SET
          game_name = EXCLUDED.game_name,
          description = EXCLUDED.description,
          max_score = EXCLUDED.max_score,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          status = EXCLUDED.status,
          game_type = EXCLUDED.game_type,
          is_completed = EXCLUDED.is_completed,
          tagline = EXCLUDED.tagline,
          track = EXCLUDED.track,
          venue = EXCLUDED.venue,
          rules = EXCLUDED.rules
        RETURNING *;
        `,
        [
          customId,
          data.game_name.trim(),
          data.description ?? null,
          data.max_score ?? 100,
          data.registrations ?? 0,
          data.submissions ?? 0,
          data.start_time,
          data.end_time,
          data.status ?? "ACTIVE",
          data.game_type ?? "ON_BOOTH",
          Boolean(data.is_completed),
          data.tagline ?? null,
          data.track ?? "Flagship Dev Track",
          data.venue ?? "Main Stage",
          data.rules ?? null,
          data.created_by ?? null,
        ],
      );
    }

    return pg.query<GameType>(
      `
      INSERT INTO ${COLLECTIONS.GAMES} (
        game_name,
        description,
        max_score,
        registrations,
        submissions,
        start_time,
        end_time,
        status,
        game_type,
        is_completed,
        tagline,
        track,
        venue,
        rules,
        created_by
      ) VALUES (
        $1::varchar,
        $2::text,
        $3::integer,
        $4::integer,
        $5::integer,
        $6::timestamptz,
        $7::timestamptz,
        $8::varchar,
        $9::varchar,
        $10::boolean,
        $11::varchar,
        $12::varchar,
        $13::varchar,
        $14::text,
        $15::varchar
      )
      RETURNING *;
      `,
      [
        data.game_name.trim(),
        data.description ?? null,
        data.max_score ?? 100,
        data.registrations ?? 0,
        data.submissions ?? 0,
        data.start_time,
        data.end_time,
        data.status ?? "ACTIVE",
        data.game_type ?? "ON_BOOTH",
        Boolean(data.is_completed),
        data.tagline ?? null,
        data.track ?? "Flagship Dev Track",
        data.venue ?? "Main Stage",
        data.rules ?? null,
        data.created_by ?? null,
      ],
    );
  };

  UPDATE_GAME_BY_ID = (id: string | number, data: updateGame_Type) => {
    return pg.query<GameType>(
      `
      UPDATE ${COLLECTIONS.GAMES}
      SET
        game_name = COALESCE($1::varchar, game_name),
        description = COALESCE($2::text, description),
        max_score = COALESCE($3::integer, max_score),
        registrations = COALESCE($4::integer, registrations),
        submissions = COALESCE($5::integer, submissions),
        start_time = COALESCE($6::timestamptz, start_time),
        end_time = COALESCE($7::timestamptz, end_time),
        status = COALESCE($8::varchar, status),
        game_type = COALESCE($9::varchar, game_type),
        is_completed = COALESCE($10::boolean, is_completed),
        tagline = COALESCE($11::varchar, tagline),
        track = COALESCE($12::varchar, track),
        venue = COALESCE($13::varchar, venue),
        rules = COALESCE($14::text, rules),
        created_by = COALESCE($15::varchar, created_by)
      WHERE id = $16::bigint
      RETURNING *;
      `,
      [
        data.game_name !== undefined ? data.game_name.trim() : null,
        data.description !== undefined ? data.description : null,
        data.max_score !== undefined ? data.max_score : null,
        data.registrations !== undefined ? data.registrations : null,
        data.submissions !== undefined ? data.submissions : null,
        data.start_time !== undefined ? data.start_time : null,
        data.end_time !== undefined ? data.end_time : null,
        data.status !== undefined ? data.status : null,
        data.game_type !== undefined ? data.game_type : null,
        data.is_completed !== undefined ? data.is_completed : null,
        data.tagline !== undefined ? data.tagline : null,
        data.track !== undefined ? data.track : null,
        data.venue !== undefined ? data.venue : null,
        data.rules !== undefined ? data.rules : null,
        data.created_by !== undefined ? data.created_by : null,
        id,
      ],
    );
  };
}

export default new GameUtils();
