import { COLLECTIONS } from "../../../constants/collections";
import pg from "../../../core/database/postgres";
import { IParticipantDoc } from "./Participants.type";
import { createParticipant_Type, updateParticipant_Type } from "./Participants.validation";

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
