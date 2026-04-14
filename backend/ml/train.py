"""
SafeHer — ML Training Pipeline (aligned with Colab notebook)
Trains 5 algorithms on NCRB data using the exact same features
as the Colab-trained LightGBM model. Saves best model + results.

Feature columns match master_dataset.csv produced by the Colab notebook:
    state_enc, district_enc, year,
    rape, kidnapping, dowry, assault, insult, cruelty,
    total_crimes, risk_score,
    rape_ratio, kidnap_ratio, domestic_ratio, assault_ratio,
    crime_trend, police_total, ipc_total
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False


# ── Feature columns — EXACTLY as in Colab notebook Cell 14 ─────────
# These match the columns produced by the Colab preprocessing pipeline
# and stored in master_dataset.csv / risk_lookup.json
FEATURE_COLS = [
    'state_enc',       # State label-encoded
    'district_enc',    # District label-encoded
    'year',            # Year 2001-2015
    'rape',            # Raw rape count
    'kidnapping',      # Raw kidnapping count
    'dowry',           # Raw dowry deaths count
    'assault',         # Raw assault on women count
    'insult',          # Raw insult to modesty count
    'cruelty',         # Raw cruelty by husband count
    'total_crimes',    # Sum of all 6 crime types
    'risk_score',      # Weighted: rape×3.0 + kidnap×2.5 + assault×2.0 + dowry×2.0 + cruelty×1.5 + insult×1.0
    'rape_ratio',      # rape / (total + 1)
    'kidnap_ratio',    # kidnapping / (total + 1)
    'domestic_ratio',  # cruelty / (total + 1)
    'assault_ratio',   # assault / (total + 1)
    'crime_trend',     # year-over-year % change (clipped ±200%)
    'police_total',    # state police strength
    'ipc_total',       # total IPC crimes in district
]

TARGET_COL = 'risk_level'  # 0=SAFE, 1=MODERATE, 2=HIGH RISK


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Replicate the Colab notebook's feature engineering (Cells 12-14)
    on a raw master_dataset.csv that has columns:
      state, district, year, rape, kidnapping, dowry, assault, insult, cruelty
    """
    df = df.copy()

    # ── A: total_crimes ───────────────────────────────────────────────
    crime_cols = ['rape', 'kidnapping', 'dowry', 'assault', 'insult', 'cruelty']
    for c in crime_cols:
        if c not in df.columns:
            df[c] = 0

    if 'total_crimes' not in df.columns:
        df['total_crimes'] = df[crime_cols].sum(axis=1)

    # ── B: weighted risk_score (Colab Cell 12) ────────────────────────
    if 'risk_score' not in df.columns:
        df['risk_score'] = (
            df['rape']       * 3.0 +
            df['kidnapping'] * 2.5 +
            df['assault']    * 2.0 +
            df['dowry']      * 2.0 +
            df['cruelty']    * 1.5 +
            df['insult']     * 1.0
        )

    # ── C: crime ratios ───────────────────────────────────────────────
    safe_total = df['total_crimes'] + 1
    if 'rape_ratio'     not in df.columns: df['rape_ratio']     = df['rape']       / safe_total
    if 'kidnap_ratio'   not in df.columns: df['kidnap_ratio']   = df['kidnapping'] / safe_total
    if 'domestic_ratio' not in df.columns: df['domestic_ratio'] = df['cruelty']    / safe_total
    if 'assault_ratio'  not in df.columns: df['assault_ratio']  = df['assault']    / safe_total

    # ── D: year trend (Colab Cell 12) ─────────────────────────────────
    if 'crime_trend' not in df.columns:
        df = df.sort_values(['state', 'district', 'year'])
        df['crime_trend'] = (
            df.groupby(['state', 'district'])['total_crimes']
            .pct_change()
            .fillna(0)
            .clip(-2, 2)
        )

    # ── E: police_total / ipc_total (fill 0 if not merged) ───────────
    if 'police_total' not in df.columns: df['police_total'] = 0
    if 'ipc_total'    not in df.columns: df['ipc_total']    = 0

    # ── F: label encode state + district ──────────────────────────────
    if 'state_enc' not in df.columns:
        le_state = LabelEncoder()
        df['state_enc'] = le_state.fit_transform(df['state'].astype(str))
    if 'district_enc' not in df.columns:
        le_dist = LabelEncoder()
        df['district_enc'] = le_dist.fit_transform(df['district'].astype(str))

    # ── G: risk_level target — within-year quantile (Colab Cell 13) ──
    if TARGET_COL not in df.columns:
        df[TARGET_COL] = (
            df.groupby('year')['risk_score']
            .transform(lambda x: pd.qcut(x, q=3, labels=[0, 1, 2], duplicates='drop'))
            .astype(int)
        )

    return df


def get_models():
    """Return the same 5 algorithms as the Colab notebook."""
    models = {
        'RandomForest': RandomForestClassifier(
            n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
        ),
        'LogisticRegression': LogisticRegression(
            max_iter=1000, random_state=42, C=1.0, solver='lbfgs', multi_class='auto'
        ),
        'KNN': KNeighborsClassifier(n_neighbors=7, n_jobs=-1),
    }
    if HAS_XGBOOST:
        models['XGBoost'] = XGBClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=8,
            random_state=42, eval_metric='mlogloss', verbosity=0
        )
    if HAS_LIGHTGBM:
        models['LightGBM'] = LGBMClassifier(
            n_estimators=200, num_leaves=31, learning_rate=0.1,
            random_state=42, verbose=-1
        )
    return models


def train_all_models():
    """Main training pipeline — matches Colab notebook flow."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_dir = os.path.join(base_dir, 'data', 'processed')
    models_dir = os.path.join(base_dir, 'ml', 'models')
    os.makedirs(models_dir, exist_ok=True)

    # ── Load master_dataset.csv (Colab output, preferred) ────────────
    master_path = os.path.join(processed_dir, 'master_dataset.csv')
    training_path = os.path.join(processed_dir, 'training_data.csv')

    if os.path.exists(master_path):
        df = pd.read_csv(master_path)
        print(f"Loaded master_dataset.csv: {df.shape}")
    elif os.path.exists(training_path):
        df = pd.read_csv(training_path)
        print(f"Loaded training_data.csv (fallback): {df.shape}")
    else:
        print("No data found. Run preprocess.py first.")
        return None, {}

    # ── Feature engineering (replicates Colab Cells 12-14) ───────────
    df = build_features(df)

    # ── Select available features ─────────────────────────────────────
    available_features = [f for f in FEATURE_COLS if f in df.columns]
    print(f"\nUsing {len(available_features)}/{len(FEATURE_COLS)} features: {available_features}")

    X = df[available_features].fillna(0).values
    y = df[TARGET_COL].values

    print(f"Feature matrix: {X.shape}")
    print(f"Risk level distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    # ── 80/20 stratified split ────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # ── Apply SMOTE for class balancing ───────────────────────────────
    if HAS_SMOTE:
        print("\nApplying SMOTE for class balancing...")
        sm = SMOTE(random_state=42)
        X_train, y_train = sm.fit_resample(X_train, y_train)
        print(f"After SMOTE: {np.bincount(y_train.astype(int))}")

    # ── Train & evaluate all models ───────────────────────────────────
    models = get_models()
    results = {}

    print("\n" + "=" * 60)
    print("TRAINING ALL MODELS")
    print("=" * 60)

    for name, model in models.items():
        print(f"\n--- {name} ---")
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
        print(f"CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, y_pred)
        print(f"Test Accuracy: {test_acc:.4f}")
        print(classification_report(y_test, y_pred,
              target_names=['SAFE', 'MODERATE', 'HIGH RISK']))

        results[name] = {
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'test_accuracy': float(test_acc),
        }

        if hasattr(model, 'feature_importances_'):
            importance = dict(zip(available_features, model.feature_importances_.tolist()))
            results[name]['feature_importance'] = importance
            top = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
            print(f"Top 5 features: {top}")

    # ── Select best model ─────────────────────────────────────────────
    best_name = max(results, key=lambda k: results[k]['test_accuracy'])
    best_model = models[best_name]
    best_acc = results[best_name]['test_accuracy']

    print("\n" + "=" * 60)
    print(f"BEST MODEL: {best_name} (Accuracy: {best_acc:.4f})")
    print("=" * 60)

    # ── Save best model ───────────────────────────────────────────────
    if HAS_JOBLIB:
        model_path = os.path.join(models_dir, 'crime_model.pkl')
        joblib.dump(best_model, model_path)
        joblib.dump(available_features, os.path.join(models_dir, 'feature_cols.pkl'))
        print(f"Saved model to {model_path}")

    # ── Save training results ─────────────────────────────────────────
    summary = {
        'best_model': best_name,
        'best_accuracy': best_acc,
        'districts_cached': int(df['district'].nunique()),
        'states_cached': int(df['state'].nunique()),
        'models': {k: {kk: vv for kk, vv in v.items() if kk != 'report'}
                   for k, v in results.items()}
    }
    results_path = os.path.join(models_dir, 'training_results.json')
    with open(results_path, 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    print(f"Saved results to {results_path}")

    print("\n--- MODEL COMPARISON ---")
    for name, res in sorted(results.items(), key=lambda x: x[1]['test_accuracy'], reverse=True):
        marker = " \u2605 BEST" if name == best_name else ""
        print(f"  {name}: {res['test_accuracy']:.4f}{marker}")

    return best_model, results


if __name__ == '__main__':
    train_all_models()
