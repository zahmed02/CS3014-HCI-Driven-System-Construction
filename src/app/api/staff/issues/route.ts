import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/lib/oracle';
import { verifyToken } from '@/lib/auth';

// POST – report a new issue
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { description, photoPaths } = await req.json();
  if (!description || description.trim() === '') {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO issues (description, reported_by, photo_paths, status, created_at)
       VALUES (:1, :2, :3, 'open', CURRENT_TIMESTAMP)`,
      [description, payload.userId, photoPaths || null],
      { autoCommit: true }
    );
    return NextResponse.json({ success: true, message: 'Issue reported successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}

// GET – list issues reported by this staff member (optional)
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
      `SELECT issue_id, description, photo_paths, status, created_at, resolved_at
       FROM issues WHERE reported_by = :staffId
       ORDER BY created_at DESC`,
      [payload.userId]
    );
    const issues = result.rows.map(row => ({
      id: row[0],
      description: row[1],
      photoPaths: row[2],
      status: row[3],
      createdAt: row[4] instanceof Date ? row[4].toISOString() : row[4],
      resolvedAt: row[5] ? (row[5] instanceof Date ? row[5].toISOString() : row[5]) : null,
    }));
    return NextResponse.json({ issues });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}