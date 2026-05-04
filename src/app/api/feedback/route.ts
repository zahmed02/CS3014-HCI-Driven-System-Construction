import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'attendee') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { eventId, rating, comment } = await req.json();
  if (!eventId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Valid eventId and rating (1-5) required' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Check if already registered
    const regCheck = await conn.execute(
      `SELECT registration_id FROM attendee_registrations WHERE event_id = :eid AND attendee_id = :aid`,
      [eventId, payload.userId]
    );
    if (!regCheck.rows?.length) {
      return NextResponse.json({ error: 'You are not registered for this event' }, { status: 403 });
    }

    // Check if feedback already exists
    const existing = await conn.execute(
      `SELECT feedback_id FROM feedback WHERE event_id = :eid AND attendee_id = :aid`,
      [eventId, payload.userId]
    );
    if (existing.rows?.length) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 });
    }

    await conn.execute(
      `INSERT INTO feedback (event_id, attendee_id, rating, feedback_comment)
       VALUES (:1, :2, :3, :4)`,
      [eventId, payload.userId, rating, comment || null],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}