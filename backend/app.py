"""
SafeHer — Main Flask Application
Women Safety Crime Prediction System API
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes.safety import safety_bp, init_predictor as init_safety
from routes.heatmap import heatmap_bp, init_predictor as init_heatmap
from routes.trends import trends_bp, init_predictor as init_trends
from routes.reports import reports_bp, init_db
from routes.sos import sos_bp
from ml.predict import predictor


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Initialize incident reports database
    init_db(base_dir)

    # Load ML model and pre-compute predictions
    print("Loading SafeHer ML model (Colab-trained, NCRB data)...")
    if not predictor.load(base_dir):
        print("WARNING: Model not loaded. Ensure these files exist:")
        print("  backend/ml/models/risk_lookup.json")
        print("  backend/data/processed/master_dataset.csv")
    else:
        print(f"Model loaded successfully. {len(predictor.risk_cache)} districts cached.")

    # Wire predictor to route modules
    init_safety(predictor)
    init_heatmap(predictor)
    init_trends(predictor)

    # Register blueprints
    app.register_blueprint(safety_bp)
    app.register_blueprint(heatmap_bp)
    app.register_blueprint(trends_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(sos_bp)

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'ok',
            'model_loaded': predictor.loaded,
            'districts_cached': len(predictor.risk_cache),
            'states_cached': len(predictor.state_averages),
            'app': 'SafeHer Women Safety API'
        })

    # Model info — full training results
    @app.route('/api/model-info', methods=['GET'])
    def model_info():
        import json
        results_path = os.path.join(base_dir, 'ml', 'models', 'training_results.json')
        if os.path.exists(results_path):
            with open(results_path) as f:
                data = json.load(f)
            # Attach live stats
            data['districts_cached'] = len(predictor.risk_cache)
            data['states_cached'] = len(predictor.state_averages)
            data['dataset'] = 'NCRB District-wise Crimes Against Women (2001-2015)'
            data['risk_labels'] = {
                '0': 'SAFE',
                '1': 'MODERATE',
                '2': 'HIGH RISK'
            }
            data['label_distribution'] = {
                'SAFE': sum(1 for d in predictor.risk_cache.values() if d['risk_code'] == 0),
                'MODERATE': sum(1 for d in predictor.risk_cache.values() if d['risk_code'] == 1),
                'HIGH_RISK': sum(1 for d in predictor.risk_cache.values() if d['risk_code'] == 2),
            }
            return jsonify(data)
        return jsonify({'message': 'No training results available'})

    return app


# Instantiate the application globally for Gunicorn
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
