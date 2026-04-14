"""
SafeHer — Data Preprocessing Pipeline
Generates synthetic NCRB-like data and processes it for ML training.
Replace generate_synthetic_data() with real CSV loading when you have NCRB files.
"""

import pandas as pd
import numpy as np
import os
import joblib
from sklearn.preprocessing import LabelEncoder

# Real Indian states and union territories
STATES = [
    'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH',
    'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JHARKHAND',
    'KARNATAKA', 'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR',
    'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'PUNJAB',
    'RAJASTHAN', 'SIKKIM', 'TAMIL NADU', 'TELANGANA', 'TRIPURA',
    'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
    'A & N ISLANDS', 'CHANDIGARH', 'D & N HAVELI', 'DAMAN & DIU',
    'DELHI UT', 'LAKSHADWEEP', 'PUDUCHERRY'
]

# Real districts per state (subset — ~700 total)
DISTRICTS_BY_STATE = {
    'ANDHRA PRADESH': ['ADILABAD', 'ANANTAPUR', 'CHITTOOR', 'EAST GODAVARI', 'GUNTUR',
                       'HYDERABAD', 'KADAPA', 'KARIMNAGAR', 'KHAMMAM', 'KRISHNA',
                       'KURNOOL', 'MAHBUBNAGAR', 'MEDAK', 'NALGONDA', 'NELLORE',
                       'NIZAMABAD', 'PRAKASAM', 'RANGAREDDY', 'SRIKAKULAM',
                       'VISHAKHAPATNAM', 'VIZIANAGARAM', 'WARANGAL', 'WEST GODAVARI'],
    'ARUNACHAL PRADESH': ['CHANGLANG', 'EAST KAMENG', 'EAST SIANG', 'LOHIT', 'LOWER SUBANSIRI',
                          'PAPUM PARE', 'TAWANG', 'TIRAP', 'UPPER SIANG', 'UPPER SUBANSIRI',
                          'WEST KAMENG', 'WEST SIANG'],
    'ASSAM': ['BARPETA', 'BONGAIGAON', 'CACHAR', 'DARRANG', 'DHEMAJI', 'DHUBRI',
              'DIBRUGARH', 'GOALPARA', 'GOLAGHAT', 'HAILAKANDI', 'JORHAT',
              'KAMRUP', 'KARBI ANGLONG', 'KARIMGANJ', 'KOKRAJHAR', 'LAKHIMPUR',
              'MORIGAON', 'NAGAON', 'NALBARI', 'NORTH CACHAR HILLS',
              'SIBSAGAR', 'SONITPUR', 'TINSUKIA'],
    'BIHAR': ['ARARIA', 'AURANGABAD', 'BANKA', 'BEGUSARAI', 'BHAGALPUR', 'BHOJPUR',
              'BUXAR', 'DARBHANGA', 'EAST CHAMPARAN', 'GAYA', 'GOPALGANJ',
              'JAMUI', 'JEHANABAD', 'KATIHAR', 'KHAGARIA', 'KISHANGANJ',
              'LAKHISARAI', 'MADHEPURA', 'MADHUBANI', 'MUNGER', 'MUZAFFARPUR',
              'NALANDA', 'NAWADA', 'PATNA', 'PURNIA', 'ROHTAS', 'SAHARSA',
              'SAMASTIPUR', 'SARAN', 'SHEIKHPURA', 'SITAMARHI', 'SIWAN',
              'SUPAUL', 'VAISHALI', 'WEST CHAMPARAN'],
    'CHHATTISGARH': ['BASTAR', 'BILASPUR', 'DANTEWADA', 'DHAMTARI', 'DURG',
                     'JANJGIR-CHAMPA', 'JASHPUR', 'KANKER', 'KAWARDHA', 'KORBA',
                     'KORIYA', 'MAHASAMUND', 'RAIGARH', 'RAIPUR', 'RAJNANDGAON',
                     'SURGUJA'],
    'GOA': ['NORTH GOA', 'SOUTH GOA'],
    'GUJARAT': ['AHMEDABAD', 'AMRELI', 'ANAND', 'BANASKANTHA', 'BHARUCH', 'BHAVNAGAR',
                'DAHOD', 'GANDHINAGAR', 'JAMNAGAR', 'JUNAGADH', 'KUTCH',
                'MEHSANA', 'NARMADA', 'NAVSARI', 'PANCHMAHAL', 'PATAN',
                'PORBANDAR', 'RAJKOT', 'SABARKANTHA', 'SURAT', 'SURENDRANAGAR',
                'VADODARA', 'VALSAD'],
    'HARYANA': ['AMBALA', 'BHIWANI', 'FARIDABAD', 'FATEHABAD', 'GURGAON', 'HISAR',
                'JHAJJAR', 'JIND', 'KAITHAL', 'KARNAL', 'KURUKSHETRA',
                'MAHENDRAGARH', 'PANCHKULA', 'PANIPAT', 'REWARI', 'ROHTAK',
                'SIRSA', 'SONIPAT', 'YAMUNANAGAR'],
    'HIMACHAL PRADESH': ['BILASPUR', 'CHAMBA', 'HAMIRPUR', 'KANGRA', 'KINNAUR',
                         'KULLU', 'LAHAUL AND SPITI', 'MANDI', 'SHIMLA', 'SIRMAUR',
                         'SOLAN', 'UNA'],
    'JHARKHAND': ['BOKARO', 'CHATRA', 'DEOGHAR', 'DHANBAD', 'DUMKA',
                  'EAST SINGHBHUM', 'GARHWA', 'GIRIDIH', 'GODDA', 'GUMLA',
                  'HAZARIBAG', 'KODERMA', 'LOHARDAGA', 'PAKUR', 'PALAMU',
                  'RANCHI', 'SAHEBGANJ', 'SERAIKELA KHARSAWAN', 'SIMDEGA',
                  'WEST SINGHBHUM'],
    'KARNATAKA': ['BAGALKOT', 'BANGALORE', 'BELGAUM', 'BELLARY', 'BIDAR',
                  'BIJAPUR', 'CHAMARAJANAGAR', 'CHIKMAGALUR', 'CHITRADURGA',
                  'DAKSHINA KANNADA', 'DAVANAGERE', 'DHARWAD', 'GADAG',
                  'GULBARGA', 'HASSAN', 'HAVERI', 'KODAGU', 'KOLAR',
                  'KOPPAL', 'MANDYA', 'MYSORE', 'RAICHUR', 'SHIMOGA',
                  'TUMKUR', 'UDUPI', 'UTTARA KANNADA'],
    'KERALA': ['ALAPPUZHA', 'ERNAKULAM', 'IDUKKI', 'KANNUR', 'KASARAGOD',
               'KOLLAM', 'KOTTAYAM', 'KOZHIKODE', 'MALAPPURAM', 'PALAKKAD',
               'PATHANAMTHITTA', 'THIRUVANANTHAPURAM', 'THRISSUR', 'WAYANAD'],
    'MADHYA PRADESH': ['BALAGHAT', 'BARWANI', 'BETUL', 'BHIND', 'BHOPAL',
                       'CHHATARPUR', 'CHHINDWARA', 'DAMOH', 'DATIA', 'DEWAS',
                       'DHAR', 'DINDORI', 'GUNA', 'GWALIOR', 'HARDA',
                       'HOSHANGABAD', 'INDORE', 'JABALPUR', 'JHABUA', 'KATNI',
                       'KHANDWA', 'KHARGONE', 'MANDLA', 'MANDSAUR', 'MORENA',
                       'NARSINGHPUR', 'NEEMUCH', 'PANNA', 'RAISEN', 'RAJGARH',
                       'RATLAM', 'REWA', 'SAGAR', 'SATNA', 'SEHORE', 'SEONI',
                       'SHAHDOL', 'SHAJAPUR', 'SHEOPUR', 'SHIVPURI', 'SIDHI',
                       'TIKAMGARH', 'UJJAIN', 'UMARIA', 'VIDISHA'],
    'MAHARASHTRA': ['AHMEDNAGAR', 'AKOLA', 'AMRAVATI', 'AURANGABAD', 'BEED',
                    'BHANDARA', 'BULDHANA', 'CHANDRAPUR', 'DHULE', 'GADCHIROLI',
                    'GONDIA', 'HINGOLI', 'JALGAON', 'JALNA', 'KOLHAPUR',
                    'LATUR', 'MUMBAI', 'NAGPUR', 'NANDED', 'NANDURBAR',
                    'NASHIK', 'OSMANABAD', 'PARBHANI', 'PUNE', 'RAIGAD',
                    'RATNAGIRI', 'SANGLI', 'SATARA', 'SINDHUDURG', 'SOLAPUR',
                    'THANE', 'WARDHA', 'WASHIM', 'YAVATMAL'],
    'MANIPUR': ['BISHNUPUR', 'CHANDEL', 'CHURACHANDPUR', 'IMPHAL EAST',
                'IMPHAL WEST', 'SENAPATI', 'TAMENGLONG', 'THOUBAL', 'UKHRUL'],
    'MEGHALAYA': ['EAST GARO HILLS', 'EAST KHASI HILLS', 'JAINTIA HILLS',
                  'RI BHOI', 'SOUTH GARO HILLS', 'WEST GARO HILLS', 'WEST KHASI HILLS'],
    'MIZORAM': ['AIZAWL', 'CHAMPHAI', 'KOLASIB', 'LAWNGTLAI', 'LUNGLEI',
                'MAMIT', 'SAIHA', 'SERCHHIP'],
    'NAGALAND': ['DIMAPUR', 'KOHIMA', 'MOKOKCHUNG', 'MON', 'PHEK',
                 'TUENSANG', 'WOKHA', 'ZUNHEBOTO'],
    'ODISHA': ['ANGUL', 'BALASORE', 'BARGARH', 'BHADRAK', 'BOLANGIR',
               'BOUDH', 'CUTTACK', 'DEOGARH', 'DHENKANAL', 'GAJAPATI',
               'GANJAM', 'JAGATSINGHPUR', 'JAJPUR', 'JHARSUGUDA', 'KALAHANDI',
               'KANDHAMAL', 'KENDRAPARA', 'KEONJHAR', 'KHURDA', 'KORAPUT',
               'MALKANGIRI', 'MAYURBHANJ', 'NABARANGPUR', 'NAYAGARH', 'NUAPADA',
               'PURI', 'RAYAGADA', 'SAMBALPUR', 'SUBARNAPUR', 'SUNDARGARH'],
    'PUNJAB': ['AMRITSAR', 'BATHINDA', 'FARIDKOT', 'FATEHGARH SAHIB', 'FIROZPUR',
               'GURDASPUR', 'HOSHIARPUR', 'JALANDHAR', 'KAPURTHALA', 'LUDHIANA',
               'MANSA', 'MOGA', 'MUKTSAR', 'NAWANSHAHR', 'PATIALA',
               'ROPAR', 'SANGRUR'],
    'RAJASTHAN': ['AJMER', 'ALWAR', 'BANSWARA', 'BARAN', 'BARMER',
                  'BHARATPUR', 'BHILWARA', 'BIKANER', 'BUNDI', 'CHITTORGARH',
                  'CHURU', 'DAUSA', 'DHOLPUR', 'DUNGARPUR', 'GANGANAGAR',
                  'HANUMANGARH', 'JAIPUR', 'JAISALMER', 'JALORE', 'JHALAWAR',
                  'JHUNJHUNU', 'JODHPUR', 'KARAULI', 'KOTA', 'NAGAUR',
                  'PALI', 'RAJSAMAND', 'SAWAI MADHOPUR', 'SIKAR', 'SIROHI',
                  'TONK', 'UDAIPUR'],
    'SIKKIM': ['EAST SIKKIM', 'NORTH SIKKIM', 'SOUTH SIKKIM', 'WEST SIKKIM'],
    'TAMIL NADU': ['ARIYALUR', 'CHENNAI', 'COIMBATORE', 'CUDDALORE', 'DHARMAPURI',
                   'DINDIGUL', 'ERODE', 'KANCHIPURAM', 'KANNIYAKUMARI', 'KARUR',
                   'KRISHNAGIRI', 'MADURAI', 'NAGAPATTINAM', 'NAMAKKAL', 'NILGIRIS',
                   'PERAMBALUR', 'PUDUKKOTTAI', 'RAMANATHAPURAM', 'SALEM',
                   'SIVAGANGA', 'THANJAVUR', 'THENI', 'TIRUCHIRAPPALLI',
                   'TIRUNELVELI', 'TIRUVALLUR', 'TIRUVANNAMALAI', 'TIRUVARUR',
                   'TUTICORIN', 'VELLORE', 'VILLUPURAM', 'VIRUDHUNAGAR'],
    'TELANGANA': ['ADILABAD', 'HYDERABAD', 'KARIMNAGAR', 'KHAMMAM', 'MAHBUBNAGAR',
                  'MEDAK', 'NALGONDA', 'NIZAMABAD', 'RANGAREDDY', 'WARANGAL'],
    'TRIPURA': ['DHALAI', 'NORTH TRIPURA', 'SOUTH TRIPURA', 'WEST TRIPURA'],
    'UTTAR PRADESH': ['AGRA', 'ALIGARH', 'ALLAHABAD', 'AMBEDKAR NAGAR', 'AURAIYA',
                      'AZAMGARH', 'BAGHPAT', 'BAHRAICH', 'BALLIA', 'BALRAMPUR',
                      'BANDA', 'BARABANKI', 'BAREILLY', 'BASTI', 'BIJNOR',
                      'BUDAUN', 'BULANDSHAHR', 'CHANDAULI', 'CHITRAKOOT', 'DEORIA',
                      'ETAH', 'ETAWAH', 'FAIZABAD', 'FARRUKHABAD', 'FATEHPUR',
                      'FIROZABAD', 'GAUTAM BUDDHA NAGAR', 'GHAZIABAD', 'GHAZIPUR',
                      'GONDA', 'GORAKHPUR', 'HAMIRPUR', 'HARDOI', 'JALAUN',
                      'JAUNPUR', 'JHANSI', 'KANNAUJ', 'KANPUR DEHAT', 'KANPUR NAGAR',
                      'KAUSHAMBI', 'KUSHINAGAR', 'LAKHIMPUR KHERI', 'LALITPUR',
                      'LUCKNOW', 'MAHARAJGANJ', 'MAHOBA', 'MAINPURI', 'MATHURA',
                      'MAU', 'MEERUT', 'MIRZAPUR', 'MORADABAD', 'MUZAFFARNAGAR',
                      'PILIBHIT', 'PRATAPGARH', 'RAE BARELI', 'RAMPUR', 'SAHARANPUR',
                      'SANT KABIR NAGAR', 'SANT RAVIDAS NAGAR', 'SHAHJAHANPUR',
                      'SHRAWASTI', 'SIDDHARTHNAGAR', 'SITAPUR', 'SONBHADRA',
                      'SULTANPUR', 'UNNAO', 'VARANASI'],
    'UTTARAKHAND': ['ALMORA', 'BAGESHWAR', 'CHAMOLI', 'CHAMPAWAT', 'DEHRADUN',
                    'HARIDWAR', 'NAINITAL', 'PAURI GARHWAL', 'PITHORAGARH',
                    'RUDRAPRAYAG', 'TEHRI GARHWAL', 'UDHAM SINGH NAGAR', 'UTTARKASHI'],
    'WEST BENGAL': ['BANKURA', 'BARDHAMAN', 'BIRBHUM', 'COOCH BEHAR', 'DAKSHIN DINAJPUR',
                    'DARJEELING', 'HOOGHLY', 'HOWRAH', 'JALPAIGURI', 'KOLKATA',
                    'MALDA', 'MEDINIPUR EAST', 'MEDINIPUR WEST', 'MURSHIDABAD',
                    'NADIA', 'NORTH 24 PARGANAS', 'PURULIA', 'SOUTH 24 PARGANAS',
                    'UTTAR DINAJPUR'],
    'A & N ISLANDS': ['ANDAMAN', 'NICOBAR'],
    'CHANDIGARH': ['CHANDIGARH'],
    'D & N HAVELI': ['DADRA AND NAGAR HAVELI'],
    'DAMAN & DIU': ['DAMAN', 'DIU'],
    'DELHI UT': ['CENTRAL', 'EAST', 'NEW DELHI', 'NORTH', 'NORTH EAST',
                 'NORTH WEST', 'SOUTH', 'SOUTH EAST', 'SOUTH WEST', 'WEST'],
    'LAKSHADWEEP': ['LAKSHADWEEP'],
    'PUDUCHERRY': ['KARAIKAL', 'MAHE', 'PUDUCHERRY', 'YANAM']
}

# Approximate lat/lng centroids for districts (subset for map)
DISTRICT_COORDS = {
    'HYDERABAD': (17.385, 78.4867), 'MUMBAI': (19.076, 72.8777),
    'DELHI UT|CENTRAL': (28.6358, 77.2245), 'DELHI UT|NEW DELHI': (28.6139, 77.2090),
    'CHENNAI': (13.0827, 80.2707), 'KOLKATA': (22.5726, 88.3639),
    'BANGALORE': (12.9716, 77.5946), 'PUNE': (18.5204, 73.8567),
    'AHMEDABAD': (23.0225, 72.5714), 'JAIPUR': (26.9124, 75.7873),
    'LUCKNOW': (26.8467, 80.9462), 'KANPUR NAGAR': (26.4499, 80.3319),
    'PATNA': (25.6093, 85.1376), 'INDORE': (22.7196, 75.8577),
    'BHOPAL': (23.2599, 77.4126), 'NAGPUR': (21.1458, 79.0882),
    'SURAT': (21.1702, 72.8311), 'VADODARA': (22.3072, 73.1812),
    'GURGAON': (28.4595, 77.0266), 'COIMBATORE': (11.0168, 76.9558),
    'MADURAI': (9.9252, 78.1198), 'VARANASI': (25.3176, 82.9739),
    'AGRA': (27.1767, 78.0081), 'RANCHI': (23.3441, 85.3096),
    'GWALIOR': (26.2183, 78.1828), 'JODHPUR': (26.2389, 73.0243),
    'AMRITSAR': (31.6340, 74.8723), 'LUDHIANA': (30.9010, 75.8573),
    'THIRUVANANTHAPURAM': (8.5241, 76.9366), 'KOCHI': (9.9312, 76.2673),
    'VISAKHAPATNAM': (17.6868, 83.2185), 'DEHRADUN': (30.3165, 78.0322),
    'SHIMLA': (31.1048, 77.1734), 'GUWAHATI': (26.1445, 91.7362),
}

# State-level risk profiles (higher values = more crime-prone based on real NCRB patterns)
STATE_RISK_PROFILES = {
    'UTTAR PRADESH': 1.8, 'RAJASTHAN': 1.6, 'MADHYA PRADESH': 1.7,
    'ANDHRA PRADESH': 1.3, 'MAHARASHTRA': 1.4, 'WEST BENGAL': 1.5,
    'BIHAR': 1.3, 'ODISHA': 1.2, 'DELHI UT': 1.9, 'HARYANA': 1.5,
    'KARNATAKA': 1.1, 'TAMIL NADU': 1.0, 'KERALA': 0.8,
    'JHARKHAND': 1.3, 'CHHATTISGARH': 1.4, 'ASSAM': 1.2,
    'PUNJAB': 1.0, 'GUJARAT': 1.1, 'TELANGANA': 1.2,
    'UTTARAKHAND': 0.9, 'HIMACHAL PRADESH': 0.7, 'GOA': 0.6,
    'TRIPURA': 1.1, 'MEGHALAYA': 0.9, 'MANIPUR': 0.8,
    'NAGALAND': 0.5, 'MIZORAM': 0.4, 'ARUNACHAL PRADESH': 0.6,
    'SIKKIM': 0.3, 'A & N ISLANDS': 0.3, 'CHANDIGARH': 0.8,
    'D & N HAVELI': 0.5, 'DAMAN & DIU': 0.4, 'LAKSHADWEEP': 0.2,
    'PUDUCHERRY': 0.7
}


def generate_synthetic_data():
    """
    Generate synthetic NCRB-like district-level crime data.
    This mimics the structure of real NCRB files:
    - 42_District_wise_crimes_against_women_2001_2012.csv
    - 42_District_wise_crimes_against_women_2013.csv
    - 42_District_wise_crimes_against_women_2014.csv
    - District-wise_Crimes_against_Women_2015.csv
    """
    np.random.seed(42)
    rows = []

    for state, districts in DISTRICTS_BY_STATE.items():
        risk_mult = STATE_RISK_PROFILES.get(state, 1.0)

        for district in districts:
            # District-level random variation
            dist_mult = np.random.uniform(0.5, 1.8)

            for year in range(2001, 2016):
                # Year trend: slight increase over time
                year_factor = 1.0 + (year - 2001) * 0.02

                base = risk_mult * dist_mult * year_factor

                rape = max(0, int(np.random.poisson(15 * base)))
                kidnapping = max(0, int(np.random.poisson(20 * base)))
                dowry_deaths = max(0, int(np.random.poisson(5 * base)))
                assault = max(0, int(np.random.poisson(25 * base)))
                insult_to_modesty = max(0, int(np.random.poisson(10 * base)))
                cruelty_by_husband = max(0, int(np.random.poisson(40 * base)))
                importation_of_girls = max(0, int(np.random.poisson(1 * base)))

                total = (rape + kidnapping + dowry_deaths + assault +
                         insult_to_modesty + cruelty_by_husband + importation_of_girls)

                rows.append({
                    'state': state,
                    'district': district,
                    'year': year,
                    'rape': rape,
                    'kidnapping': kidnapping,
                    'dowry_deaths': dowry_deaths,
                    'assault': assault,
                    'insult_to_modesty': insult_to_modesty,
                    'cruelty_by_husband': cruelty_by_husband,
                    'importation_of_girls': importation_of_girls,
                    'total_crimes': total
                })

    df = pd.DataFrame(rows)
    return df


def load_real_data(data_dir):
    """
    Load real NCRB CSV files. Call this instead of generate_synthetic_data()
    when you have the actual datasets in backend/data/raw/
    """
    files = [
        '42_District_wise_crimes_against_women_2001_2012.csv',
        '42_District_wise_crimes_against_women_2013.csv',
        '42_District_wise_crimes_against_women_2014.csv',
        'District-wise_Crimes_against_Women_2015.csv'
    ]

    dfs = []
    for f in files:
        path = os.path.join(data_dir, f)
        if os.path.exists(path):
            df = pd.read_csv(path)
            dfs.append(df)
            print(f"Loaded {f}: {df.shape}")

    if not dfs:
        print("No real data found. Using synthetic data.")
        return generate_synthetic_data()

    df = pd.concat(dfs, ignore_index=True)

    # Standardize column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    rename_map = {
        'state/ut': 'state', 'states/uts': 'state', 'state/_ut': 'state',
        'district/_area': 'district', 'district/area': 'district',
        'kidnapping_and_abduction': 'kidnapping',
        'kidnapping_&_abduction': 'kidnapping',
        'kidnapping_&_abduction_total': 'kidnapping',
        'assault_on_women_with_intent_to_outrage_her_modesty': 'assault',
        'insult_to_the_modesty_of_women': 'insult_to_modesty',
        'cruelty_by_husband_or_his_relatives': 'cruelty_by_husband',
        'importation_of_girls': 'importation_of_girls',
        'total_crimes_against_women': 'total_crimes'
    }
    df.rename(columns=rename_map, inplace=True)

    # Standardize state/district names
    if 'state' in df.columns:
        df['state'] = df['state'].str.upper().str.strip()
    if 'district' in df.columns:
        df['district'] = df['district'].str.upper().str.strip()

    return df


def preprocess(df):
    """Feature engineering and encoding."""
    crime_cols = ['rape', 'kidnapping', 'dowry_deaths', 'assault',
                  'insult_to_modesty', 'cruelty_by_husband', 'importation_of_girls']

    # Fill missing values
    for col in crime_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    # Ensure total_crimes exists
    if 'total_crimes' not in df.columns:
        df['total_crimes'] = df[[c for c in crime_cols if c in df.columns]].sum(axis=1)

    # Drop rows without district
    df = df.dropna(subset=['district', 'state'])
    df = df[df['district'] != 'TOTAL']
    df = df[df['district'] != 'ZZ TOTAL']

    # Feature engineering
    df['rape_ratio'] = df['rape'] / (df['total_crimes'] + 1)
    df['kidnap_ratio'] = df['kidnapping'] / (df['total_crimes'] + 1)
    df['assault_ratio'] = df['assault'] / (df['total_crimes'] + 1)
    df['cruelty_ratio'] = df['cruelty_by_husband'] / (df['total_crimes'] + 1)

    # Year trend per district
    df = df.sort_values(['state', 'district', 'year'])
    df['year_trend'] = df.groupby(['state', 'district'])['total_crimes'].pct_change().fillna(0)
    df['year_trend'] = df['year_trend'].clip(-2, 2)  # Cap extreme values

    # Create risk level target (3 classes)
    df['risk_level'] = pd.qcut(df['total_crimes'], q=3, labels=[0, 1, 2], duplicates='drop')
    df['risk_level'] = df['risk_level'].astype(int)

    # Encode state and district
    le_state = LabelEncoder()
    le_district = LabelEncoder()
    df['state_encoded'] = le_state.fit_transform(df['state'])
    df['district_encoded'] = le_district.fit_transform(df['district'])

    return df, le_state, le_district


def run_preprocessing():
    """Main preprocessing pipeline."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_dir = os.path.join(base_dir, 'data', 'processed')
    raw_dir = os.path.join(base_dir, 'data', 'raw')
    models_dir = os.path.join(base_dir, 'ml', 'models')

    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(raw_dir, exist_ok=True)

    # Try real data first, fall back to synthetic
    if os.path.exists(raw_dir) and any(f.endswith('.csv') for f in os.listdir(raw_dir)):
        print("Loading real NCRB data...")
        df = load_real_data(raw_dir)
    else:
        print("No real data found. Generating synthetic NCRB-like data...")
        df = generate_synthetic_data()

    print(f"Raw data shape: {df.shape}")

    # Preprocess
    df, le_state, le_district = preprocess(df)
    print(f"Processed data shape: {df.shape}")
    print(f"Risk level distribution:\n{df['risk_level'].value_counts()}")

    # Save
    df.to_csv(os.path.join(processed_dir, 'training_data.csv'), index=False)
    joblib.dump(le_state, os.path.join(models_dir, 'state_encoder.pkl'))
    joblib.dump(le_district, os.path.join(models_dir, 'district_encoder.pkl'))

    print(f"\nSaved training_data.csv ({len(df)} rows)")
    print(f"Saved encoders to {models_dir}")

    return df, le_state, le_district


if __name__ == '__main__':
    run_preprocessing()
