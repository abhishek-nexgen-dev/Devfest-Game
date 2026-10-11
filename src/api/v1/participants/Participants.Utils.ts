import { COLLECTIONS } from "../../../constants/collections";
import pg from "../../../core/database/postgres";
import { IParticipantDoc } from "./Participants.type";
import { createParticipant_Type, updateParticipant_Type } from "./Participants.validation";

class ParticipantUtils {
  FIND_ALL_PARTICIPANT = () => {
    return pg.query<IParticipantDoc>(
      `
    SELECT
      ticket_id,
      name,
      profile_image,
      games,
      social_link,
      is_certificate_claim
    FROM ${COLLECTIONS.PARTICIPANTS}
    ORDER BY total_points DESC;
  `,
    );
  };

  FIND_PARTICIPANT_BY_TICKET_ID = (TicketId: string) => {
    return pg.query<IParticipantDoc>(
      `SELECT * FROM ${COLLECTIONS.PARTICIPANTS} WHERE ticket_id = $1 LIMIT 1;`,
      [TicketId],
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
      github_url,
      primary_language
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[])
    RETURNING *;
    `,
      [
        data.ticket_id,
        data.name,
        data.email,
        data.mobile_number,
        data.social_link,
        data.profile_image ?? null,
        data.location,
        data.github_url ?? null,
        data.primary_language,
      ],
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
        github_url = COALESCE($7, github_url),
        primary_language = COALESCE($8::text[], primary_language),
        games = COALESCE($9::jsonb, games),
        total_points = COALESCE($10, total_points),
        is_certificate_claim = COALESCE($11, is_certificate_claim)
      WHERE ticket_id = $12
      RETURNING *;
      `,
      [
        data.name ?? null,
        data.email ?? null,
        data.mobile_number ?? null,
        data.social_link ?? null,
        data.profile_image ?? null,
        data.location ?? null,
        data.github_url ?? null,
        data.primary_language ?? null,
        data.games !== undefined ? JSON.stringify(data.games) : null,
        data.total_points ?? null,
        data.is_certificate_claim ?? null,
        TicketId,
      ],
    );
  };
}

export default new ParticipantUtils();
