import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
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
  if (!payload || payload.role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const proposalId = parseInt(id);
  if (isNaN(proposalId)) {
    return NextResponse.json({ error: 'Invalid proposal ID' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();

    // Verify that the proposal belongs to this vendor
    const check = await conn.execute(
      `SELECT registration_id FROM vendor_registrations 
       WHERE registration_id = :id AND vendor_id = :vendorId AND status = 'pending'`,
      [proposalId, payload.userId]
    );
    if (!check.rows || check.rows.length === 0) {
      return NextResponse.json({ error: 'Proposal not found, not owned, or already processed' }, { status: 404 });
    }

    // Delete the pending proposal
    await conn.execute(`DELETE FROM vendor_registrations WHERE registration_id = :id`, [proposalId], {
      autoCommit: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}