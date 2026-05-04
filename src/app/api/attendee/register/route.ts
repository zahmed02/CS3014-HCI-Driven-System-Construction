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

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    // Check if already registered
    const existing = await conn.execute(
      `SELECT registration_id FROM attendee_registrations WHERE event_id = :eid AND attendee_id = :aid`,
      [eventId, payload.userId]
    );
    if (existing.rows?.length) {
      return NextResponse.json({ error: 'Already registered' }, { status: 409 });
    }
    await conn.execute(
      `INSERT INTO attendee_registrations (event_id, attendee_id) VALUES (:1, :2)`,
      [eventId, payload.userId],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}