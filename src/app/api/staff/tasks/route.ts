import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'staff') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT t.task_id, t.title, t.description, t.priority, t.deadline, t.status, e.title as event_title
       FROM tasks t
       JOIN events e ON t.event_id = e.event_id
       WHERE t.assigned_to = :userId
       ORDER BY t.deadline ASC NULLS LAST`,
      [payload.userId]
    );
    const tasks = result.rows.map(row => ({
      id: row[0],
      title: row[1],
      description: row[2],
      priority: row[3],
      deadline: row[4],
      status: row[5],
      eventTitle: row[6],
    }));
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}