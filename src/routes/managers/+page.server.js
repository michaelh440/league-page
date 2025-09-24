import { query } from '$lib/db';

export async function load() {
 const managers = (await query(`
  SELECT 
    manager_id::int,
    username,
    logo_url,
    philosophy,
    signature_moves,
    year_joined,
  FROM managers
  ORDER BY manager_id
`)).rows;

  return { managers };
}
