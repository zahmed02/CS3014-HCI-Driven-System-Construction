import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

// Helper to convert Oracle values
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
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT venue_id, name, address, capacity, amenities FROM venues ORDER BY name`);
    const venues = result.rows.map(row => ({
      id: toPrimitive(row[0]),
      name: toPrimitive(row[1]),
      address: toPrimitive(row[2]),
      capacity: toPrimitive(row[3]),
      amenities: toPrimitive(row[4]),
    }));
    return NextResponse.json({ venues });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
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

  const { name, address, capacity, amenities } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO venues (name, address, capacity, amenities) VALUES (:1, :2, :3, :4)`,
      [name, address || null, capacity || null, amenities || null],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}