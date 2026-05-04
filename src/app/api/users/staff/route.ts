import { NextResponse } from 'next/server';
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

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT user_id, full_name FROM users WHERE role = 'staff' ORDER BY full_name`
    );
    const staff = result.rows.map(row => ({
      id: toPrimitive(row[0]),
      name: toPrimitive(row[1]),
    }));
    return NextResponse.json({ staff });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}