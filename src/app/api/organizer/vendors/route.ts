import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

// Helper to safely convert Oracle values
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
    const result = await conn.execute(
      `SELECT vr.registration_id, vr.event_id, e.title as event_title,
              vr.vendor_id, u.full_name as vendor_name,
              vr.proposal_text, vr.documents, vr.status, vr.comments, vr.created_at
       FROM vendor_registrations vr
       JOIN events e ON vr.event_id = e.event_id
       JOIN users u ON vr.vendor_id = u.user_id
       WHERE e.organizer_id = :org
       ORDER BY vr.created_at DESC`,
      [payload.userId]
    );

    const vendors = result.rows.map(row => ({
      id: toPrimitive(row[0]),
      eventId: toPrimitive(row[1]),
      eventTitle: toPrimitive(row[2]),
      vendorId: toPrimitive(row[3]),
      vendorName: toPrimitive(row[4]),
      proposal: toPrimitive(row[5]) || '',      // ← proposal_text
      documents: toPrimitive(row[6]),
      status: toPrimitive(row[7]),
      comments: toPrimitive(row[8]),
      createdAt: toPrimitive(row[9]),
    }));
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'organizer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { registrationId, status, comments } = await req.json();
  if (!registrationId || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE vendor_registrations SET status = :1, comments = :2 WHERE registration_id = :3`,
      [status, comments || null, registrationId],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}