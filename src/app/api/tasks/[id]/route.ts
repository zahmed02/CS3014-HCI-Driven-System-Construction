import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

function toPrimitive(v: any) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return v;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const taskId = parseInt(id);
  if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT task_id, title, description, priority, deadline, status, event_id, assigned_to
       FROM tasks WHERE task_id = :id`,
      [taskId]
    );
    if (!result.rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = result.rows[0];
    const task = {
      id: toPrimitive(row[0]),
      title: toPrimitive(row[1]),
      description: toPrimitive(row[2]),
      priority: toPrimitive(row[3]),
      deadline: toPrimitive(row[4]),
      status: toPrimitive(row[5]),
      eventId: toPrimitive(row[6]),
      assignedTo: toPrimitive(row[7]),
    };
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const taskId = parseInt(id);
  if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const { title, description, priority, deadline, status, eventId, assignedTo } = await req.json();
  if (!title || !eventId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE tasks
       SET title = :1, description = :2, priority = :3,
           deadline = TO_TIMESTAMP(:4, 'YYYY-MM-DD"T"HH24:MI:SS'),
           status = :5, event_id = :6, assigned_to = :7
       WHERE task_id = :8`,
      [title, description || null, priority, deadline || null, status, eventId, assignedTo || null, taskId],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const taskId = parseInt(id);
  if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM tasks WHERE task_id = :id`, [taskId], { autoCommit: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}