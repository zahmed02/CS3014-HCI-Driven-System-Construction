import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import oracledb from 'oracledb';   // <-- ADD THIS IMPORT
import { getConnection } from './oracle';

const JWT_SECRET = process.env.JWT_SECRET || 'eventops-secret';
const SALT_ROUNDS = 10;

export interface User {
  USER_ID: number;
  EMAIL: string;
  PASSWORD_HASH: string;
  FULL_NAME: string;
  ROLE: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT user_id, email, password_hash, full_name, role 
       FROM users WHERE email = :email`,
      [email]
    );
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        USER_ID: row[0],
        EMAIL: row[1],
        PASSWORD_HASH: row[2],
        FULL_NAME: row[3],
        ROLE: row[4],
      };
    }
    return null;
  } finally {
    await conn.close();
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT user_id, email, password_hash, full_name, role 
       FROM users WHERE user_id = :id`,
      [userId]
    );
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        USER_ID: row[0],
        EMAIL: row[1],
        PASSWORD_HASH: row[2],
        FULL_NAME: row[3],
        ROLE: row[4],
      };
    }
    return null;
  } finally {
    await conn.close();
  }
}

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: string
): Promise<number> {
  const conn = await getConnection();
  try {
    const hashedPassword = await hashPassword(password);
    // Use a simple INSERT without returning the ID, then query the generated ID.
    // This avoids bind variable complexity.
    await conn.execute(
      `INSERT INTO users (email, password_hash, full_name, role) 
       VALUES (:email, :hash, :name, :role)`,
      [email, hashedPassword, fullName, role],
      { autoCommit: true }
    );
    
    // Retrieve the last inserted ID (Oracle uses a sequence under the hood for IDENTITY)
    const result = await conn.execute(
      `SELECT user_id FROM users WHERE email = :email`,
      [email]
    );
    if (result.rows && result.rows.length > 0) {
      return result.rows[0][0];
    }
    throw new Error('Failed to retrieve user ID');
  } finally {
    await conn.close();
  }
}