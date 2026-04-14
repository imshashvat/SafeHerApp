"""
SafeHer — Prediction & Caching Module
Loads Colab-trained risk_lookup.json and master_dataset.csv
for real-time district safety predictions backed by real NCRB data.
"""

import os
import json
import datetime
import numpy as np
import pandas as pd
import difflib


class SafetyPredictor:
    """Prediction engine using pre-computed risk_lookup from Colab-trained LightGBM model."""

    RISK_LABELS = {0: 'SAFE', 1: 'MODERATE', 2: 'HIGH RISK'}
    RISK_COLORS = {0: '#00D4AA', 1: '#FFB800', 2: '#FF3366'}

    # Crime column mapping: risk_lookup keys → display names
    CRIME_DISPLAY = {
        'rape': 'Rape',
        'kidnapping': 'Kidnapping & Abduction',
        'dowry': 'Dowry Deaths',
        'assault': 'Assault on Women',
        'insult': 'Insult to Modesty',
        'cruelty': 'Cruelty by Husband',
    }

    def __init__(self):
        self.risk_cache = {}          # STATE|DISTRICT → risk dict
        self.district_data = None     # master_dataset DataFrame for trends
        self.state_averages = {}      # STATE → aggregated risk dict
        self.loaded = False

    def load(self, base_dir=None):
        """Load risk_lookup.json and master_dataset.csv."""
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        models_dir = os.path.join(base_dir, 'ml', 'models')
        processed_dir = os.path.join(base_dir, 'data', 'processed')

        # ── 1. Load risk_lookup.json (pre-computed by Colab) ──────────────
        lookup_path = os.path.join(models_dir, 'risk_lookup.json')
        if not os.path.exists(lookup_path):
            print(f"ERROR: risk_lookup.json not found at {lookup_path}")
            return False

        with open(lookup_path, 'r') as f:
            raw_lookup = json.load(f)

        print(f"Loaded risk_lookup.json with {len(raw_lookup)} entries.")

        # Convert raw lookup into the API-compatible risk_cache format
        for key, entry in raw_lookup.items():
            risk_code = int(entry.get('risk_level', 1))
            breakdown = entry.get('breakdown', {})

            self.risk_cache[key] = {
                'state': entry['state'],
                'district': entry['district'],
                'risk_level': self.RISK_LABELS.get(risk_code, 'MODERATE'),
                'risk_code': risk_code,
                'confidence': round(float(entry.get('confidence', 0.85)), 3),
                'crime_rate': int(entry.get('total_crimes', 0)),
                'risk_score': float(entry.get('risk_score', 0)),
                'color': self.RISK_COLORS.get(risk_code, '#FFB800'),
                'breakdown': breakdown,
                'last_year': int(entry.get('last_year', 2015)),
                'data_source': 'NCRB (2001-2015)',
            }

        # ── 2. Load master_dataset.csv for accurate all-year totals ──────
        master_path = os.path.join(processed_dir, 'master_dataset.csv')
        if os.path.exists(master_path):
            self.district_data = pd.read_csv(master_path)
            print(f"Loaded master_dataset.csv: {self.district_data.shape[0]} rows, "
                  f"{self.district_data.shape[1]} columns.")
        else:
            # Fallback to old training_data.csv if master not available
            fallback_path = os.path.join(processed_dir, 'training_data.csv')
            if os.path.exists(fallback_path):
                self.district_data = pd.read_csv(fallback_path)
                print(f"Loaded training_data.csv (fallback): {self.district_data.shape[0]} rows.")
            else:
                print("WARNING: No dataset found for trend analysis.")
                self.district_data = pd.DataFrame()

        # ── 3. Compute state averages using FULL dataset totals ───────────
        self._compute_state_averages()

        self.loaded = True
        print(f"SafetyPredictor ready. {len(self.risk_cache)} districts, "
              f"{len(self.state_averages)} states cached.")
        return True

    def _compute_state_averages(self):
        """Compute aggregate risk per state using full dataset (all years) when available."""
        # Prefer full dataset totals from master_dataset.csv (more accurate)
        if self.district_data is not None and not self.district_data.empty:
            df = self.district_data
            crime_cols = ['rape', 'kidnapping', 'dowry', 'assault', 'insult', 'cruelty', 'total_crimes']
            available_cols = [c for c in crime_cols if c in df.columns]

            state_agg = df.groupby('state')[available_cols].sum().reset_index()

            # Get risk code from risk_cache state groups
            state_groups = {}
            for entry in self.risk_cache.values():
                state = entry['state']
                if state not in state_groups:
                    state_groups[state] = []
                state_groups[state].append(entry)

            for _, row in state_agg.iterrows():
                state = row['state']
                total_crimes = int(row.get('total_crimes', 0))
                districts = state_groups.get(state, [])
                num_districts = len(districts)

                if districts:
                    avg_code = np.mean([d['risk_code'] for d in districts])
                    avg_score = np.mean([d.get('risk_score', 0) for d in districts])
                    risk_code = int(round(avg_code))
                    avg_crime = total_crimes / num_districts if num_districts > 0 else 0
                else:
                    risk_code = 1
                    avg_score = 0
                    avg_crime = 0

                # Build crime type breakdown for state
                state_breakdown = {}
                for col in ['rape', 'kidnapping', 'dowry', 'assault', 'insult', 'cruelty']:
                    if col in row.index:
                        state_breakdown[col] = int(row.get(col, 0))

                self.state_averages[state] = {
                    'state': state,
                    'risk_level': self.RISK_LABELS.get(risk_code, 'MODERATE'),
                    'risk_code': risk_code,
                    'avg_crime_rate': round(avg_crime, 1),
                    'total_crimes': total_crimes,
                    'avg_risk_score': round(avg_score, 1),
                    'color': self.RISK_COLORS.get(risk_code, '#FFB800'),
                    'num_districts': num_districts,
                    'breakdown': state_breakdown,
                }
        else:
            # Fallback: compute from risk_cache last-year values only
            state_groups = {}
            for entry in self.risk_cache.values():
                state = entry['state']
                if state not in state_groups:
                    state_groups[state] = []
                state_groups[state].append(entry)

            for state, districts in state_groups.items():
                avg_code = np.mean([d['risk_code'] for d in districts])
                avg_crime = np.mean([d['crime_rate'] for d in districts])
                total_crimes = sum([d['crime_rate'] for d in districts])
                avg_score = np.mean([d.get('risk_score', 0) for d in districts])
                risk_code = int(round(avg_code))

                self.state_averages[state] = {
                    'state': state,
                    'risk_level': self.RISK_LABELS.get(risk_code, 'MODERATE'),
                    'risk_code': risk_code,
                    'avg_crime_rate': round(avg_crime, 1),
                    'total_crimes': total_crimes,
                    'avg_risk_score': round(avg_score, 1),
                    'color': self.RISK_COLORS.get(risk_code, '#FFB800'),
                    'num_districts': len(districts),
                }

    def apply_time_multiplier(self, risk_score, current_hour=None):
        """Adjust risk based on time of day (night = higher risk)."""
        if current_hour is None:
            current_hour = datetime.datetime.now().hour

        if 22 <= current_hour or current_hour <= 5:
            return min(risk_score * 1.4, 1.0)    # Late night: +40%
        elif 18 <= current_hour <= 22:
            return min(risk_score * 1.15, 1.0)   # Evening:   +15%
        return risk_score

    def match_district(self, district_name, state_name):
        """3-tier fuzzy matching: exact → same-state fuzzy → state average fallback."""
        query = district_name.upper().strip()
        state = state_name.upper().strip()

        # Tier 1: Exact match
        key = f"{state}|{query}"
        if key in self.risk_cache:
            return self.risk_cache[key]

        # Tier 2: Fuzzy match within same state
        state_keys = [k for k in self.risk_cache if k.startswith(f"{state}|")]
        state_districts = [k.split('|')[1] for k in state_keys]

        if state_districts:
            matches = difflib.get_close_matches(query, state_districts, n=1, cutoff=0.6)
            if matches:
                matched_key = f"{state}|{matches[0]}"
                result = dict(self.risk_cache[matched_key])
                result['matched_as'] = matches[0]
                return result

        # Tier 3: State average fallback
        if state in self.state_averages:
            result = dict(self.state_averages[state])
            result['district'] = district_name
            result['note'] = 'State average (district not found in NCRB data)'
            return result

        return None

    def get_safety_score(self, state, district, hour=None):
        """Get safety score for a location with optional time-of-day adjustment."""
        result = self.match_district(district, state)

        if result is None:
            return {
                'state': state,
                'district': district,
                'risk_level': 'UNKNOWN',
                'risk_code': -1,
                'confidence': 0,
                'crime_rate': 0,
                'color': '#888888',
                'breakdown': {},
                'time_adjusted': False,
                'note': 'Location not found in NCRB database',
            }

        result = dict(result)

        # Apply time-of-day multiplier
        if hour is not None:
            base_score = result['risk_code'] / 2.0  # Normalize 0-2 → 0-1
            adjusted = self.apply_time_multiplier(base_score, hour)
            if adjusted > 0.66:
                result['risk_level'] = 'HIGH RISK'
                result['risk_code'] = 2
                result['color'] = '#FF3366'
            elif adjusted > 0.33:
                result['risk_level'] = 'MODERATE'
                result['risk_code'] = 1
                result['color'] = '#FFB800'
            result['time_adjusted'] = True
            result['hour'] = hour
        else:
            result['time_adjusted'] = False

        return result

    def get_all_districts(self):
        """Return all cached district predictions for heatmap."""
        return list(self.risk_cache.values())

    def get_trends(self, state=None, district=None):
        """Get crime trends over years from master_dataset."""
        if self.district_data is None or self.district_data.empty:
            return []

        df = self.district_data

        if district and state:
            s_upper = state.upper()
            d_upper = district.upper()
            mask = (df['state'].str.upper() == s_upper) & (df['district'].str.upper() == d_upper)
        elif state:
            s_upper = state.upper()
            mask = df['state'].str.upper() == s_upper
        else:
            mask = pd.Series([True] * len(df))

        filtered = df[mask]
        if filtered.empty:
            return []

        # Use actual column names from master_dataset.csv
        crime_cols = ['rape', 'kidnapping', 'dowry', 'assault',
                      'insult', 'cruelty', 'total_crimes']

        available_cols = [c for c in crime_cols if c in filtered.columns]
        if not available_cols:
            return []

        trends = filtered.groupby('year')[available_cols].sum().reset_index()
        return trends.to_dict(orient='records')

    def get_state_rankings(self):
        """Get states ranked by total crimes across all years (most dangerous first)."""
        rankings = sorted(
            self.state_averages.values(),
            key=lambda x: x.get('total_crimes', 0),
            reverse=True,
        )
        for i, r in enumerate(rankings):
            r['rank'] = i + 1
        return rankings

    def get_crime_type_breakdown(self):
        """Get aggregated crime type counts across all years from full dataset."""
        if self.district_data is not None and not self.district_data.empty:
            df = self.district_data
            crime_cols_map = {
                'rape': 'rape',
                'kidnapping': 'kidnapping',
                'dowry': 'dowry',
                'assault': 'assault',
                'insult': 'insult',
                'cruelty': 'cruelty',
            }
            totals = {}
            for col, label in crime_cols_map.items():
                if col in df.columns:
                    totals[label] = int(df[col].sum())
            return totals

        # Fallback: sum from risk_cache breakdown (single year per district)
        totals = {}
        for d in self.risk_cache.values():
            for crime_type, count in d.get('breakdown', {}).items():
                totals[crime_type] = totals.get(crime_type, 0) + int(count)
        return totals

    def get_ml_stats(self):
        """Return ML model performance stats from training_results.json."""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        results_path = os.path.join(base_dir, 'ml', 'models', 'training_results.json')
        if os.path.exists(results_path):
            with open(results_path) as f:
                return json.load(f)
        return None


# Singleton instance
predictor = SafetyPredictor()
