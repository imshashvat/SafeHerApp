"""Safety check API endpoint."""

from flask import Blueprint, request, jsonify
import datetime

safety_bp = Blueprint('safety', __name__)

# Will be set by app.py after model loads
predictor = None


def init_predictor(pred):
    global predictor
    predictor = pred


@safety_bp.route('/api/safety-check', methods=['POST'])
def safety_check():
    """
    Check safety score for a given location.
    Expects JSON: { "state": "...", "district": "...", "hour": 14 }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    state = data.get('state', '').strip()
    district = data.get('district', '').strip()
    hour = data.get('hour')

    if not state or not district:
        return jsonify({'error': 'state and district are required'}), 400

    if hour is None:
        hour = datetime.datetime.now().hour

    result = predictor.get_safety_score(state, district, hour)
    result['timestamp'] = datetime.datetime.now().isoformat()

    return jsonify(result)


@safety_bp.route('/api/safety-check-batch', methods=['POST'])
def safety_check_batch():
    """Check safety for multiple locations at once."""
    data = request.get_json()
    if not data or 'locations' not in data:
        return jsonify({'error': 'locations array required'}), 400

    results = []
    for loc in data['locations'][:20]:  # Max 20 at a time
        state = loc.get('state', '')
        district = loc.get('district', '')
        hour = loc.get('hour')
        result = predictor.get_safety_score(state, district, hour)
        results.append(result)

    return jsonify({'results': results})


@safety_bp.route('/api/route-safety', methods=['POST'])
def route_safety():
    """
    Get safety data + nearby police stations for a route.
    Expects JSON: {
        "state": "...", "district": "...", "hour": 14,
        "start_lat": ..., "start_lon": ...,
        "end_lat": ..., "end_lon": ...
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    state = data.get('state', '').strip()
    district = data.get('district', '').strip()
    hour = data.get('hour')

    if not state or not district:
        return jsonify({'error': 'state and district are required'}), 400

    if hour is None:
        hour = datetime.datetime.now().hour

    # Get ML safety prediction
    safety = predictor.get_safety_score(state, district, hour)
    safety['timestamp'] = datetime.datetime.now().isoformat()

    return jsonify(safety)
