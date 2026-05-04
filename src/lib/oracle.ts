import oracledb from 'oracledb';

// Force CLOB columns to be returned as strings (prevents circular JSON errors)
oracledb.fetchAsString = [oracledb.CLOB];

oracledb.autoCommit = true;

let poolInitialized = false;

export async function getConnection() {
  if (!poolInitialized) {
    await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      poolMin: 1,
      poolMax: 10,
      poolIncrement: 1,
    });
    poolInitialized = true;
  }
  return await oracledb.getConnection();
}

export async function closePool() {
  if (poolInitialized) {
    await oracledb.getPool().close();
    poolInitialized = false;
  }
}

export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params);
    return result.rows as T[];
  } finally {
    await conn.close();
  }
}

export async function executeSingleRow<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await executeQuery<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}