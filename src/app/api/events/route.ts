import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT event_id, title, start_date, status 
       FROM events WHERE organizer_id = :org
       ORDER BY created_at DESC`,
      [payload.userId]
    );
    const events = result.rows.map(row => ({
      event_id: row[0],
      title: row[1],
      start_date: row[2],
      status: row[3],
    }));
    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, description, startDate, endDate, venueId, status } = await req.json();

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate status (default to 'draft' if invalid)
  let validStatus = 'draft';
  if (status && (status === 'draft' || status === 'published')) {
    validStatus = status;
  }

  let conn;
  try {
    conn = await getConnection();

    // Insert using positional binds (avoid reserved words)
    // Now includes the status field from the frontend
    await conn.execute(
      `INSERT INTO events (title, description, start_date, end_date, venue_id, organizer_id, status)
       VALUES (:1, :2, TO_TIMESTAMP(:3, 'YYYY-MM-DD"T"HH24:MI:SS'), 
               TO_TIMESTAMP(:4, 'YYYY-MM-DD"T"HH24:MI:SS'), :5, :6, :7)`,
      [title, description || null, startDate, endDate, venueId || null, payload.userId, validStatus],
      { autoCommit: false }
    );

    // Retrieve the newly created event ID
    const result = await conn.execute(
      `SELECT event_id FROM events 
       WHERE title = :1 AND organizer_id = :2 
       ORDER BY created_at DESC FETCH FIRST 1 ROW ONLY`,
      [title, payload.userId]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to retrieve event ID');
    }
    const eventId = result.rows[0][0];
    await conn.commit();

    return NextResponse.json({ success: true, eventId });
  } catch (error: any) {
    if (conn) await conn.rollback();
    console.error(error);
    // Provide user‑friendly error messages
    let message = 'Failed to create event';
    if (error?.errorNum === 1745) message = 'Invalid input (reserved word used)';
    else if (error?.errorNum === 2291) message = 'Referenced venue or organizer does not exist';
    else if (error?.message?.includes('ORA-')) message = 'Database constraint violation';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}