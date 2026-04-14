"""Crime trends API endpoint."""

from flask import Blueprint, request, jsonify

trends_bp = Blueprint('trends', __name__)

predictor = None


def init_predictor(pred):
    global predictor
    predictor = pred


@trends_bp.route('/api/crime-trends', methods=['GET'])
def crime_trends():
    """Get year-over-year crime trends. Optional query params: state, district."""
    state = request.args.get('state', '').strip() or None
    district = request.args.get('district', '').strip() or None

    trends = predictor.get_trends(state=state, district=district)
    return jsonify({
        'state': state,
        'district': district,
        'trends': trends
    })


@trends_bp.route('/api/state-rankings', methods=['GET'])
def state_rankings():
    """Get states ranked by crime rate (most dangerous first)."""
    rankings = predictor.get_state_rankings()

    top_n = request.args.get('top', type=int, default=35)
    return jsonify({
        'total': len(rankings),
        'rankings': rankings[:top_n]
    })


@trends_bp.route('/api/crime-types', methods=['GET'])
def crime_types():
    """Get crime type breakdown aggregated across all districts."""
    totals = predictor.get_crime_type_breakdown()
    return jsonify({'crime_types': totals})
