import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  const { status } = await req.json();
  if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verify the task belongs to this staff member
    const checkResult = await conn.execute(
      `SELECT task_id FROM tasks WHERE task_id = :id AND assigned_to = :staffId`,
      [taskId, payload.userId]
    );
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or not assigned to you' }, { status: 404 });
    }

    await conn.execute(
      `UPDATE tasks SET status = :1 WHERE task_id = :2`,
      [status, taskId],
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

// Optional: GET single task details if needed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'staff') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const taskId = parseInt(id);
  if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT task_id, title, description, priority, deadline, status, event_id
       FROM tasks WHERE task_id = :id AND assigned_to = :staff`,
      [taskId, payload.userId]
    );
    if (!result.rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = result.rows[0];
    const task = {
      id: row[0],
      title: row[1],
      description: row[2],
      priority: row[3],
      deadline: row[4] instanceof Date ? row[4].toISOString() : row[4],
      status: row[5],
      eventId: row[6],
    };
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}