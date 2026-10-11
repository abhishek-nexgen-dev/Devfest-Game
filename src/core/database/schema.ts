import AuthSchema from "../../api/v1/auth/Auth.schema";
import Games_Schema from "../../api/v1/games/Games.Schema";
import Participants_Schema from "../../api/v1/participants/Participants.Schema";

export const initSchemas = async (): Promise<void> => {
  await AuthSchema();
  await Games_Schema();
  await Participants_Schema();
};

export default initSchemas;
