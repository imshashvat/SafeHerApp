/**
 * database.ts — SQLite Database Service
 *
 * Uses expo-sqlite for a fully offline, on-device database.
 * All user data (profile, guardians, settings, alert history) is stored
 * per-user with userId foreign keys for data isolation.
 */

import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

let db: SQLite.SQLiteDatabase | null = null;

// ─── Initialization ──────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('safeher.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      blood_group TEXT DEFAULT '',
      medical_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      relation TEXT DEFAULT 'Guardian',
      priority INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      trigger_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      location TEXT DEFAULT 'Unknown',
      status TEXT DEFAULT 'sent',
      sent_to INTEGER DEFAULT 0,
      guardian_names TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      shake_sensitivity INTEGER DEFAULT 3,
      fall_detection INTEGER DEFAULT 1,
      voice_keyword INTEGER DEFAULT 0,
      auto_video_record INTEGER DEFAULT 1,
      sms_alerts INTEGER DEFAULT 1,
      email_alerts INTEGER DEFAULT 1,
      auto_call_sos INTEGER DEFAULT 1,
      auto_call_guardian INTEGER DEFAULT 1,
      check_in_interval INTEGER DEFAULT 30,
      map_theme TEXT DEFAULT 'light',
      app_theme TEXT DEFAULT 'dark',
      language TEXT DEFAULT 'en',
      is_onboarded INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: add app_theme column for existing databases
  try {
    await db.runAsync(`ALTER TABLE user_settings ADD COLUMN app_theme TEXT DEFAULT 'dark'`);
  } catch {
    // Column already exists — ignore
  }
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ─── Password Hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'safeher_salt_2024'
  );
  return digest;
}

// ─── User Operations ─────────────────────────────────────────────────────────

export interface DbUser {
  id: number;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  blood_group: string;
  medical_notes: string;
  created_at: string;
}

export async function registerUser(
  name: string,
  phone: string,
  password: string,
  email: string = '',
  bloodGroup: string = ''
): Promise<DbUser | null> {
  const database = getDb();
  const hash = await hashPassword(password);

  try {
    const result = await database.runAsync(
      `INSERT INTO users (name, phone, email, password_hash, blood_group)
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email, hash, bloodGroup]
    );

    // Create default settings for the new user
    await database.runAsync(
      `INSERT INTO user_settings (user_id) VALUES (?)`,
      [result.lastInsertRowId]
    );

    return await getUserById(result.lastInsertRowId);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return null; // Phone already registered
    }
    throw err;
  }
}

export async function loginUser(
  phone: string,
  password: string
): Promise<DbUser | null> {
  const database = getDb();
  const hash = await hashPassword(password);

  const row = await database.getFirstAsync<DbUser>(
    `SELECT * FROM users WHERE phone = ? AND password_hash = ?`,
    [phone, hash]
  );

  return row ?? null;
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const database = getDb();
  const row = await database.getFirstAsync<DbUser>(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  );
  return row ?? null;
}

export async function updateUserProfile(
  userId: number,
  updates: { name?: string; email?: string; blood_group?: string; medical_notes?: string }
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.blood_group !== undefined) { fields.push('blood_group = ?'); values.push(updates.blood_group); }
  if (updates.medical_notes !== undefined) { fields.push('medical_notes = ?'); values.push(updates.medical_notes); }

  if (fields.length === 0) return;
  values.push(userId);

  await database.runAsync(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

// ─── Guardian Operations ─────────────────────────────────────────────────────

export interface DbGuardian {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  email: string;
  relation: string;
  priority: number;
}

export async function getGuardians(userId: number): Promise<DbGuardian[]> {
  const database = getDb();
  return await database.getAllAsync<DbGuardian>(
    `SELECT * FROM guardians WHERE user_id = ? ORDER BY priority ASC`,
    [userId]
  );
}

export async function addGuardian(
  userId: number,
  guardian: { name: string; phone: string; email: string; relation: string; priority: number }
): Promise<number> {
  const database = getDb();
  const result = await database.runAsync(
    `INSERT INTO guardians (user_id, name, phone, email, relation, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, guardian.name, guardian.phone, guardian.email, guardian.relation, guardian.priority]
  );
  return result.lastInsertRowId;
}

export async function removeGuardian(guardianId: number): Promise<void> {
  const database = getDb();
  await database.runAsync(`DELETE FROM guardians WHERE id = ?`, [guardianId]);
}

export async function updateGuardian(
  guardianId: number,
  updates: Partial<{ name: string; phone: string; email: string; relation: string; priority: number }>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.relation !== undefined) { fields.push('relation = ?'); values.push(updates.relation); }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }

  if (fields.length === 0) return;
  values.push(guardianId);

  await database.runAsync(
    `UPDATE guardians SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

// ─── Settings Operations ─────────────────────────────────────────────────────

export interface DbSettings {
  user_id: number;
  shake_sensitivity: number;
  fall_detection: number;     // 0|1
  voice_keyword: number;      // 0|1
  auto_video_record: number;  // 0|1
  sms_alerts: number;         // 0|1
  email_alerts: number;       // 0|1
  auto_call_sos: number;      // 0|1
  auto_call_guardian: number;  // 0|1
  check_in_interval: number;
  map_theme: string;
  app_theme: string;
  language: string;
  is_onboarded: number;       // 0|1
}

export async function getUserSettings(userId: number): Promise<DbSettings | null> {
  const database = getDb();
  const row = await database.getFirstAsync<DbSettings>(
    `SELECT * FROM user_settings WHERE user_id = ?`,
    [userId]
  );
  return row ?? null;
}

export async function saveUserSettings(
  userId: number,
  settings: Partial<Omit<DbSettings, 'user_id'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const mapping: Record<string, string> = {
    shakeSensitivity: 'shake_sensitivity',
    fallDetection: 'fall_detection',
    voiceKeyword: 'voice_keyword',
    autoVideoRecord: 'auto_video_record',
    smsAlerts: 'sms_alerts',
    emailAlerts: 'email_alerts',
    autoCallOnSOS: 'auto_call_sos',
    autoCallGuardian: 'auto_call_guardian',
    checkInInterval: 'check_in_interval',
    mapTheme: 'map_theme',
    appTheme: 'app_theme',
    language: 'language',
    isOnboarded: 'is_onboarded',
  };

  for (const [key, val] of Object.entries(settings)) {
    const col = mapping[key] ?? key;
    fields.push(`${col} = ?`);
    if (typeof val === 'boolean') {
      values.push(val ? 1 : 0);
    } else {
      values.push(val);
    }
  }

  if (fields.length === 0) return;
  values.push(userId);

  await database.runAsync(
    `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );
}

// ─── Alert History Operations ────────────────────────────────────────────────

export interface DbAlertLog {
  id: number;
  user_id: number;
  trigger_type: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  location: string;
  status: string;
  sent_to: number;
  guardian_names: string; // JSON array string
}

export async function getAlertHistory(userId: number): Promise<DbAlertLog[]> {
  const database = getDb();
  return await database.getAllAsync<DbAlertLog>(
    `SELECT * FROM alert_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100`,
    [userId]
  );
}

export async function addAlertLog(
  userId: number,
  alert: {
    trigger: string;
    timestamp: number;
    latitude: number | null;
    longitude: number | null;
    location: string;
    status: string;
    sentTo: number;
    guardianNames: string[];
  }
): Promise<number> {
  const database = getDb();
  const result = await database.runAsync(
    `INSERT INTO alert_history (user_id, trigger_type, timestamp, latitude, longitude, location, status, sent_to, guardian_names)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      alert.trigger,
      alert.timestamp,
      alert.latitude,
      alert.longitude,
      alert.location,
      alert.status,
      alert.sentTo,
      JSON.stringify(alert.guardianNames),
    ]
  );
  return result.lastInsertRowId;
}

export async function clearAlertHistory(userId: number): Promise<void> {
  const database = getDb();
  await database.runAsync(`DELETE FROM alert_history WHERE user_id = ?`, [userId]);
}
