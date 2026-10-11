import { COLLECTIONS } from "../../../constants/collections";
import pg from "../../../core/database/postgres";
import { GameType } from "./Game.Type";
import { createGame_Type, updateGame_Type } from "./Games.validation";

class GameUtils {
  isGameExist = async (gameName: string): Promise<boolean> => {
    if (!gameName) return false;
    const query = `SELECT EXISTS (SELECT 1 FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1));`;
    const result = await pg.query<{ exists: boolean }>(query, [gameName.trim()]);
    return result.rows[0].exists;
  };

  isGameExistById = async (id: string | number): Promise<boolean> => {
    if (!id) return false;
    const query = `SELECT EXISTS (SELECT 1 FROM ${COLLECTIONS.GAMES} WHERE id = $1::bigint);`;
    const result = await pg.query<{ exists: boolean }>(query, [id]);
    return result.rows[0].exists;
  };

  FIND_ALL_GAMES = () => {
    return pg.query<GameType>(
      `
      SELECT *
      FROM ${COLLECTIONS.GAMES}
      ORDER BY created_at DESC;
      `,
    );
  };

  FIND_GAME_BY_ID = (id: string | number) => {
    return pg.query<GameType>(`SELECT * FROM ${COLLECTIONS.GAMES} WHERE id = $1::bigint LIMIT 1;`, [
      id,
    ]);
  };

  FIND_GAME_BY_NAME = (gameName: string) => {
    return pg.query<GameType>(
      `SELECT * FROM ${COLLECTIONS.GAMES} WHERE LOWER(game_name) = LOWER($1) LIMIT 1;`,
      [gameName.trim()],
    );
  };

  CREATE_GAME = (data: createGame_Type) => {
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
        status
      ) VALUES ($1::varchar, $2::text, $3::integer, $4::integer, $5::integer, $6::timestamptz, $7::timestamptz, $8::varchar)
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
        data.status ?? "UPCOMING",
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
        status = COALESCE($8::varchar, status)
      WHERE id = $9::bigint
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
        id,
      ],
    );
  };
}

export default new GameUtils();
