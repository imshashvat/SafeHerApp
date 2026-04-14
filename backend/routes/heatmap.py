"""Heatmap data API endpoint."""

from flask import Blueprint, jsonify

heatmap_bp = Blueprint('heatmap', __name__)

predictor = None


def init_predictor(pred):
    global predictor
    predictor = pred


@heatmap_bp.route('/api/heatmap-data', methods=['GET'])
def heatmap_data():
    """Return all district risk scores for map visualization."""
    districts = predictor.get_all_districts()
    return jsonify({
        'total': len(districts),
        'districts': districts
    })


@heatmap_bp.route('/api/state-data', methods=['GET'])
def state_data():
    """Return state-level aggregated risk data."""
    rankings = predictor.get_state_rankings()
    return jsonify({
        'total': len(rankings),
        'states': rankings
    })
