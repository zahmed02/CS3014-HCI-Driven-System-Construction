import { NextResponse } from 'next/server';
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
      `SELECT 
         e.event_id, e.title, e.start_date,
         f.rating, f.feedback_comment
       FROM attendee_registrations ar
       JOIN events e ON ar.event_id = e.event_id
       LEFT JOIN feedback f ON f.event_id = e.event_id AND f.attendee_id = ar.attendee_id
       WHERE ar.attendee_id = :userId
       ORDER BY e.start_date DESC`,
      [payload.userId]
    );
    const events = result.rows.map(row => ({
      id: row[0],
      title: row[1],
      startDate: row[2] instanceof Date ? row[2].toISOString() : row[2],
      feedbackGiven: row[3] !== null,
      rating: row[3],
      comment: row[4],
    }));
    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}