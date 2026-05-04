import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/oracle';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT 'Oracle Connected!' as message, SYSDATE as current_time FROM dual`);
    return NextResponse.json({ 
      success: true, 
      message: result.rows[0][0],
      timestamp: result.rows[0][1]
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    if (conn) await conn.close();
  }
}