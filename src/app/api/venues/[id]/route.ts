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

export async function GET(
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

  const venueId = parseInt(id);
  if (isNaN(venueId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT venue_id, name, address, capacity, amenities FROM venues WHERE venue_id = :id`,
      [venueId]
    );
    if (!result.rows?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = result.rows[0];
    const venue = {
      id: toPrimitive(row[0]),
      name: toPrimitive(row[1]),
      address: toPrimitive(row[2]),
      capacity: toPrimitive(row[3]),
      amenities: toPrimitive(row[4]),
    };
    return NextResponse.json({ venue });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
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
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const venueId = parseInt(id);
  if (isNaN(venueId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const { name, address, capacity, amenities } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE venues SET name = :1, address = :2, capacity = :3, amenities = :4 WHERE venue_id = :5`,
      [name, address || null, capacity || null, amenities || null, venueId],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
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
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const venueId = parseInt(id);
  if (isNaN(venueId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM venues WHERE venue_id = :id`, [venueId], { autoCommit: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}