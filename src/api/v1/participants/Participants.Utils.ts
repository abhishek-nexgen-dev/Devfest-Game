import { COLLECTIONS } from "../../../constants/collections";
import pg from "../../../core/database/postgres";
import { IParticipantDoc, PaginationMetadata } from "./Participants.type";
import {
  createParticipant_Type,
  updateParticipant_Type,
  ParticipantQuery_Type,
} from "./Participants.validation";

class ParticipantUtils {
  FIND_ALL_PARTICIPANT = () => {
    return pg.query<IParticipantDoc>(
      `
      SELECT *
      FROM ${COLLECTIONS.PARTICIPANTS}
      ORDER BY total_points DESC, id ASC;
      `,
    );
  };

  FIND_PAGINATED_PARTICIPANTS = async (query: ParticipantQuery_Type) => {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Search: name, email, ticket_id, location, mobile_number, github_url
    if (query.search) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(`(
        name ILIKE $${idx} OR
        email ILIKE $${idx} OR
        ticket_id ILIKE $${idx} OR
        location ILIKE $${idx} OR
        mobile_number ILIKE $${idx} OR
        github_url ILIKE $${idx}
      )`);
      values.push(searchPattern);
      idx++;
    }

    // Filter: track
    if (query.track && query.track !== "ALL") {
      conditions.push(`track = $${idx}`);
      values.push(query.track.trim());
      idx++;
    }

    // Filter: is_certificate_claim
    if (typeof query.is_certificate_claim === "boolean") {
      conditions.push(`is_certificate_claim = $${idx}`);
      values.push(query.is_certificate_claim);
      idx++;
    }

    // Filter: has_games
    if (typeof query.has_games === "boolean") {
      if (query.has_games) {
        conditions.push(`jsonb_array_length(games) > 0`);
      } else {
        conditions.push(`(games IS NULL OR jsonb_array_length(games) = 0)`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Order & Sort Column (sanitized)
    const allowedSortCols = ["total_points", "created_at", "ticket_id", "name", "id", "updated_at"];
    const sortCol = allowedSortCols.includes(query.sort_by) ? query.sort_by : "total_points";
    const sortOrder = query.order === "ASC" ? "ASC" : "DESC";

    // If query.all is true, return without pagination
    if (query.all) {
      const sql = `
        SELECT *, COUNT(*) OVER()::integer AS total_count
        FROM ${COLLECTIONS.PARTICIPANTS}
        ${whereClause}
        ORDER BY ${sortCol} ${sortOrder}, id ASC;
      `;
      const res = await pg.query<IParticipantDoc & { total_count?: number }>(sql, values);
      const total = res.rows.length > 0 ? Number(res.rows[0].total_count || res.rows.length) : 0;
      const cleanRows = res.rows.map((row) => {
        const { total_count, ...participant } = row;
        return participant as IParticipantDoc;
      });
      return {
        rows: cleanRows,
        pagination: {
          total,
          page: 1,
          limit: total || 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Paginated query
    const offset = (query.page - 1) * query.limit;
    values.push(query.limit);
    const limitIdx = idx++;
    values.push(offset);
    const offsetIdx = idx++;

    const sql = `
      SELECT *, COUNT(*) OVER()::integer AS total_count
      FROM ${COLLECTIONS.PARTICIPANTS}
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}, id ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const res = await pg.query<IParticipantDoc & { total_count?: number }>(sql, values);
    const total = res.rows.length > 0 ? Number(res.rows[0].total_count || 0) : 0;

    // If no rows matched with limit/offset, but we need total count when offset > 0
    let finalTotal = total;
    if (res.rows.length === 0 && offset > 0) {
      const countRes = await pg.query<{ count: string }>(
        `SELECT COUNT(*)::integer AS count FROM ${COLLECTIONS.PARTICIPANTS} ${whereClause};`,
        values.slice(0, limitIdx - 1),
      );
      finalTotal = Number(countRes.rows[0]?.count || 0);
    }

    const totalPages = Math.ceil(finalTotal / query.limit) || 1;
    const cleanRows = res.rows.map((row) => {
      const { total_count, ...participant } = row;
      return participant as IParticipantDoc;
    });

    return {
      rows: cleanRows,
      pagination: {
        total: finalTotal,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    };
  };

  FIND_PARTICIPANT_BY_TICKET_ID = (TicketId: string) => {
    return pg.query<IParticipantDoc>(
      `SELECT * FROM ${COLLECTIONS.PARTICIPANTS} WHERE UPPER(ticket_id) = UPPER($1) LIMIT 1;`,
      [TicketId.trim()],
    );
  };

  FIND_PARTICIPANT_BY_TICKET_AND_EMAIL = (ticketId: string, email: string) => {
    return pg.query<IParticipantDoc>(
      `SELECT * FROM ${COLLECTIONS.PARTICIPANTS} WHERE UPPER(ticket_id) = UPPER($1) AND LOWER(email) = LOWER($2) LIMIT 1;`,
      [ticketId.trim(), email.trim().toLowerCase()],
    );
  };

  CREATE_PARTICIPANT = (data: createParticipant_Type) => {
    return pg.query<IParticipantDoc>(
      `
      INSERT INTO ${COLLECTIONS.PARTICIPANTS} (
        ticket_id,
        name,
        email,
        mobile_number,
        social_link,
        profile_image,
        location,
        track,
        github_url,
        primary_language,
        games,
        total_points,
        is_certificate_claim
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], $11::jsonb, $12, $13)
      RETURNING *;
      `,
      [
        data.ticket_id.trim().toUpperCase(),
        data.name.trim(),
        data.email.trim().toLowerCase(),
        data.mobile_number.trim(),
        data.social_link?.trim() || "N/A",
        data.profile_image?.trim() || null,
        data.location.trim() || "Ranchi",
        data.track?.trim() || null,
        data.github_url?.trim() || null,
        data.primary_language,
        JSON.stringify(data.games || []),
        data.total_points ?? 0,
        data.is_certificate_claim ?? false,
      ],
    );
  };

  CREATE_BULK_PARTICIPANTS = (participants: createParticipant_Type[]) => {
    const valuePlaceholders: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const data of participants) {
      valuePlaceholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}::text[], $${paramIndex + 10}::jsonb, $${paramIndex + 11}, $${paramIndex + 12})`,
      );
      values.push(
        data.ticket_id.trim().toUpperCase(),
        data.name.trim(),
        data.email.trim().toLowerCase(),
        data.mobile_number.trim(),
        data.social_link?.trim() || "N/A",
        data.profile_image?.trim() || null,
        data.location.trim() || "Ranchi",
        data.track?.trim() || null,
        data.github_url?.trim() || null,
        data.primary_language,
        JSON.stringify(data.games || []),
        data.total_points ?? 0,
        data.is_certificate_claim ?? false,
      );
      paramIndex += 13;
    }

    return pg.query<IParticipantDoc>(
      `
      INSERT INTO ${COLLECTIONS.PARTICIPANTS} (
        ticket_id,
        name,
        email,
        mobile_number,
        social_link,
        profile_image,
        location,
        track,
        github_url,
        primary_language,
        games,
        total_points,
        is_certificate_claim
      ) VALUES ${valuePlaceholders.join(", ")}
      ON CONFLICT (ticket_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        mobile_number = EXCLUDED.mobile_number,
        social_link = EXCLUDED.social_link,
        profile_image = COALESCE(EXCLUDED.profile_image, ${COLLECTIONS.PARTICIPANTS}.profile_image),
        location = EXCLUDED.location,
        track = COALESCE(EXCLUDED.track, ${COLLECTIONS.PARTICIPANTS}.track),
        github_url = COALESCE(EXCLUDED.github_url, ${COLLECTIONS.PARTICIPANTS}.github_url),
        primary_language = EXCLUDED.primary_language,
        updated_at = NOW()
      RETURNING *;
      `,
      values,
    );
  };

  UPDATE_PARTICIPANT_BY_TICKET_ID = (TicketId: string, data: updateParticipant_Type) => {
    return pg.query<IParticipantDoc>(
      `
      UPDATE ${COLLECTIONS.PARTICIPANTS}
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        mobile_number = COALESCE($3, mobile_number),
        social_link = COALESCE($4, social_link),
        profile_image = COALESCE($5, profile_image),
        location = COALESCE($6, location),
        track = COALESCE($7, track),
        github_url = COALESCE($8, github_url),
        primary_language = COALESCE($9::text[], primary_language),
        games = COALESCE($10::jsonb, games),
        total_points = COALESCE($11, total_points),
        is_certificate_claim = COALESCE($12, is_certificate_claim)
      WHERE UPPER(ticket_id) = UPPER($13)
      RETURNING *;
      `,
      [
        data.name ?? null,
        data.email ?? null,
        data.mobile_number ?? null,
        data.social_link ?? null,
        data.profile_image ?? null,
        data.location ?? null,
        data.track ?? null,
        data.github_url ?? null,
        data.primary_language ?? null,
        data.games !== undefined ? JSON.stringify(data.games) : null,
        data.total_points ?? null,
        data.is_certificate_claim ?? null,
        TicketId.trim(),
      ],
    );
  };
}

export default new ParticipantUtils();
