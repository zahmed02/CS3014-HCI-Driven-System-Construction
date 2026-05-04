import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

function toPrimitive(value: any): any {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof value.getData === 'function') return value.toString();
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return value;
}

// ✅ GET – fetch event details (not venue)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const eventId = parseInt(id);
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.event_id, e.title, e.description, e.start_date, e.end_date,
              e.venue_id, e.status, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.venue_id
       WHERE e.event_id = :id`,
      [eventId]
    );
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const row = result.rows[0];
    const event = {
      id: toPrimitive(row[0]),
      title: toPrimitive(row[1]),
      description: toPrimitive(row[2]) || '',
      startDate: toPrimitive(row[3]),
      endDate: toPrimitive(row[4]),
      venueId: toPrimitive(row[5]),
      status: toPrimitive(row[6]),
      venueName: toPrimitive(row[7]),
    };
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

// ... (PUT and DELETE remain the same as before)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const eventId = parseInt(id);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
  }

  const { title, description, startDate, endDate, venueId, status } = await req.json();
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();
    // First check if event belongs to this organizer
    const check = await conn.execute(
      `SELECT event_id FROM events WHERE event_id = :id AND organizer_id = :org`,
      [eventId, payload.userId]
    );
    if (!check.rows?.length) {
      return NextResponse.json({ error: 'Event not found or not owned' }, { status: 404 });
    }

    await conn.execute(
      `UPDATE events
       SET title = :1, description = :2,
           start_date = TO_TIMESTAMP(:3, 'YYYY-MM-DD"T"HH24:MI:SS'),
           end_date = TO_TIMESTAMP(:4, 'YYYY-MM-DD"T"HH24:MI:SS'),
           venue_id = :5, status = :6,
           updated_at = CURRENT_TIMESTAMP
       WHERE event_id = :7`,
      [title, description || null, startDate, endDate, venueId || null, status, eventId],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise< { id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const eventId = parseInt(id);
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    // First check ownership
    const check = await conn.execute(
      `SELECT event_id FROM events WHERE event_id = :id AND organizer_id = :org`,
      [eventId, payload.userId]
    );
    if (!check.rows?.length) {
      return NextResponse.json({ error: 'Event not found or not owned' }, { status: 404 });
    }

    // Delete dependent records manually (Oracle may not cascade automatically if foreign keys are not set to CASCADE)
    await conn.execute(`DELETE FROM attendee_registrations WHERE event_id = :id`, [eventId]);
    await conn.execute(`DELETE FROM vendor_registrations WHERE event_id = :id`, [eventId]);
    await conn.execute(`DELETE FROM tasks WHERE event_id = :id`, [eventId]);
    await conn.execute(`DELETE FROM feedback WHERE event_id = :id`, [eventId]);
    await conn.execute(`DELETE FROM events WHERE event_id = :id`, [eventId], { autoCommit: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete event: ' + error.message }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}