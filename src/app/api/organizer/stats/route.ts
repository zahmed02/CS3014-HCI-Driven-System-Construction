import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();                    // ✅ await the promise
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Total events count for this organizer
    const eventsResult = await conn.execute(
      `SELECT COUNT(*) as count FROM events WHERE organizer_id = :orgId`,
      [payload.userId]
    );
    const totalEvents = eventsResult.rows[0][0];

    // Pending vendor registrations for this organizer's events
    const pendingVendorsResult = await conn.execute(
      `SELECT COUNT(*) as count FROM vendor_registrations vr
       JOIN events e ON vr.event_id = e.event_id
       WHERE e.organizer_id = :orgId AND vr.status = 'pending'`,
      [payload.userId]
    );
    const pendingVendors = pendingVendorsResult.rows[0][0];

    // Active tasks (not completed) for organizer's events
    const tasksResult = await conn.execute(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN events e ON t.event_id = e.event_id
       WHERE e.organizer_id = :orgId AND t.status != 'completed'`,
      [payload.userId]
    );
    const activeTasks = tasksResult.rows[0][0];

    // Total attendees registered for organizer's events
    const attendeesResult = await conn.execute(
      `SELECT COUNT(DISTINCT ar.attendee_id) as count FROM attendee_registrations ar
       JOIN events e ON ar.event_id = e.event_id
       WHERE e.organizer_id = :orgId`,
      [payload.userId]
    );
    const totalAttendees = attendeesResult.rows[0][0];

    // Recent events (last 5)
    const recentEventsResult = await conn.execute(
      `SELECT event_id, title, start_date, status
       FROM events
       WHERE organizer_id = :orgId
       ORDER BY created_at DESC
       FETCH FIRST 5 ROWS ONLY`,
      [payload.userId]
    );
    const recentEvents = recentEventsResult.rows.map(row => ({
      event_id: row[0],
      title: row[1],
      start_date: row[2],
      status: row[3]
    }));

    return NextResponse.json({
      stats: { totalEvents, pendingVendors, activeTasks, totalAttendees },
      recentEvents
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}