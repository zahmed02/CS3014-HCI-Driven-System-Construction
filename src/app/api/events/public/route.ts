import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/oracle';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT event_id, title FROM events WHERE status = 'published' ORDER BY start_date`
    );
    const events = result.rows.map(row => ({
      id: row[0],
      title: row[1],
    }));
    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}