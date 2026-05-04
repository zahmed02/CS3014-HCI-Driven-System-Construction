import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'attendee') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.event_id, e.title, e.start_date, v.name as venue_name,
              (SELECT COUNT(*) FROM attendee_registrations WHERE event_id = e.event_id AND attendee_id = :userId) as registered
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.venue_id
       WHERE e.status = 'published'
       ORDER BY e.start_date`,
      [payload.userId]
    );
    const events = result.rows.map(row => ({
      id: row[0],
      title: row[1],
      startDate: row[2],
      venueName: row[3],
      registered: row[4] > 0,
    }));
    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}