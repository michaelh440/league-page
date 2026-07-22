import { getTrophyRoomData } from '$lib/utils/helperFunctions/trophyRoom.js';

export async function load() {
  return await getTrophyRoomData();
}
