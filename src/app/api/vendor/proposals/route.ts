import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

function toPrimitive(value: any): any {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof value.getData === 'function') return value.toString();
  return value;
}

// GET – list proposals submitted by this vendor
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT vr.registration_id, vr.event_id, e.title, vr.proposal_text, vr.status, vr.comments, vr.created_at
       FROM vendor_registrations vr
       JOIN events e ON vr.event_id = e.event_id
       WHERE vr.vendor_id = :vendorId
       ORDER BY vr.created_at DESC`,
      [payload.userId]
    );
    const proposals = result.rows.map(row => ({
      id: toPrimitive(row[0]),
      eventId: toPrimitive(row[1]),
      eventTitle: toPrimitive(row[2]),
      proposalText: toPrimitive(row[3]) || '',
      status: toPrimitive(row[4]) || 'pending',
      comments: toPrimitive(row[5]),
      createdAt: toPrimitive(row[6]),
    }));
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

// POST – submit a new proposal for an event
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { eventId, proposalText, documents } = await req.json();
  if (!eventId || !proposalText || proposalText.trim() === '') {
    return NextResponse.json({ error: 'Event ID and proposal text are required' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Check if event exists and is published (or allowed for proposals)
    const eventCheck = await conn.execute(
      `SELECT event_id FROM events WHERE event_id = :id AND status IN ('published', 'draft')`,
      [eventId]
    );
    if (!eventCheck.rows || eventCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found or not accepting proposals' }, { status: 404 });
    }

    // Check if vendor already submitted a proposal for this event
    const existing = await conn.execute(
      `SELECT registration_id FROM vendor_registrations WHERE event_id = :eventId AND vendor_id = :vendorId`,
      [eventId, payload.userId]
    );
    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a proposal for this event' }, { status: 409 });
    }

    // Insert with autoCommit false so we can retrieve the generated ID
    await conn.execute(
      `INSERT INTO vendor_registrations (event_id, vendor_id, proposal_text, documents, status)
       VALUES (:1, :2, :3, :4, 'pending')`,
      [eventId, payload.userId, proposalText, documents || null],
      { autoCommit: false }
    );

    // Retrieve the newly created registration_id
    const result = await conn.execute(
      `SELECT registration_id FROM vendor_registrations
       WHERE event_id = :eventId AND vendor_id = :vendorId
       ORDER BY created_at DESC FETCH FIRST 1 ROW ONLY`,
      [eventId, payload.userId]
    );
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to retrieve proposal ID');
    }
    const proposalId = toPrimitive(result.rows[0][0]);
    await conn.commit();

    return NextResponse.json({ success: true, proposalId });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}