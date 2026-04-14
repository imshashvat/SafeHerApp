"""Incident reports API endpoint with SQLite storage."""

import os
import json
import sqlite3
import datetime
from flask import Blueprint, request, jsonify

reports_bp = Blueprint('reports', __name__)

DB_PATH = None


def init_db(base_dir):
    """Initialize SQLite database for incident reports."""
    global DB_PATH
    DB_PATH = os.path.join(base_dir, 'data', 'incidents.db')
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            district TEXT,
            state TEXT,
            crime_type TEXT NOT NULL,
            description TEXT,
            severity TEXT DEFAULT 'medium',
            reported_at TEXT NOT NULL,
            reporter_name TEXT DEFAULT 'Anonymous'
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Incidents database initialized at {DB_PATH}")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@reports_bp.route('/api/incidents', methods=['GET'])
def get_incidents():
    """Get all reported incidents."""
    conn = get_db()
    limit = request.args.get('limit', 100, type=int)
    state = request.args.get('state', '').strip()

    if state:
        rows = conn.execute(
            'SELECT * FROM incidents WHERE state = ? ORDER BY reported_at DESC LIMIT ?',
            (state.upper(), limit)
        ).fetchall()
    else:
        rows = conn.execute(
            'SELECT * FROM incidents ORDER BY reported_at DESC LIMIT ?',
            (limit,)
        ).fetchall()

    conn.close()

    incidents = [dict(row) for row in rows]
    return jsonify({'total': len(incidents), 'incidents': incidents})


@reports_bp.route('/api/incidents', methods=['POST'])
def create_incident():
    """Report a new incident."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    required = ['latitude', 'longitude', 'crime_type']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    conn = get_db()
    cursor = conn.execute(
        '''INSERT INTO incidents (latitude, longitude, district, state, crime_type,
           description, severity, reported_at, reporter_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            data['latitude'],
            data['longitude'],
            data.get('district', '').upper(),
            data.get('state', '').upper(),
            data['crime_type'],
            data.get('description', ''),
            data.get('severity', 'medium'),
            datetime.datetime.now().isoformat(),
            data.get('reporter_name', 'Anonymous')
        )
    )
    inserted_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'id': inserted_id, 'message': 'Incident reported successfully'}), 201


@reports_bp.route('/api/incidents/<int:incident_id>', methods=['DELETE'])
def delete_incident(incident_id):
    """Delete an incident by ID."""
    conn = get_db()
    conn.execute('DELETE FROM incidents WHERE id = ?', (incident_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
