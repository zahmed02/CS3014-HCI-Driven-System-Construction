import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

function toPrimitive(v: any) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return v;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT t.task_id, t.title, t.description, t.priority, t.deadline, t.status,
              t.event_id, e.title as event_title, t.assigned_to, u.full_name as assignee_name
       FROM tasks t
       JOIN events e ON t.event_id = e.event_id
       LEFT JOIN users u ON t.assigned_to = u.user_id
       WHERE e.organizer_id = :org
       ORDER BY t.deadline ASC NULLS LAST`,
      [payload.userId]
    );
    const tasks = result.rows.map(row => ({
      id: toPrimitive(row[0]),
      title: toPrimitive(row[1]),
      description: toPrimitive(row[2]),
      priority: toPrimitive(row[3]),
      deadline: toPrimitive(row[4]),
      status: toPrimitive(row[5]),
      eventId: toPrimitive(row[6]),
      eventTitle: toPrimitive(row[7]),
      assignedTo: toPrimitive(row[8]),
      assigneeName: toPrimitive(row[9]),
    }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
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

  const { title, description, priority, deadline, eventId, assignedTo } = await req.json();
  console.log('Received data:', { title, description, priority, deadline, eventId, assignedTo });

  if (!title || !eventId) {
    return NextResponse.json({ error: 'Title and eventId are required' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verify the event belongs to this organizer
    const eventCheck = await conn.execute(
      `SELECT event_id FROM events WHERE event_id = :id AND organizer_id = :org`,
      [eventId, payload.userId]
    );
    if (!eventCheck.rows?.length) {
      return NextResponse.json({ error: 'Event not found or not owned by you' }, { status: 404 });
    }

    // Use named bind parameters, avoid Oracle reserved words like :desc
    const sql = `
      INSERT INTO tasks (title, description, priority, deadline, event_id, assigned_to, status)
      VALUES (:title, :description_val, :priority,
              CASE WHEN :deadline IS NOT NULL
                   THEN TO_TIMESTAMP(:deadline, 'YYYY-MM-DD"T"HH24:MI:SS')
                   ELSE NULL
              END,
              :eventId, :assignedTo, 'pending')
    `;

    const binds = {
      title,
      description_val: description || null,   // renamed from :desc to avoid reserved word
      priority: priority || 'medium',
      deadline: deadline || null,
      eventId: eventId,
      assignedTo: assignedTo || null,
    };

    await conn.execute(sql, binds, { autoCommit: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create task: ' + error.message }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}