# seed_database.py (fixed / robust version)

from pymongo import MongoClient
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import random
import re
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, classification_report

# ----------------------------
# CONFIGURATION
# ----------------------------
CSV_FILE = "HateSpeechDataset_Ekman_final.csv"
MONGO_URI = "mongodb+srv://mayureshkahar777_db_user:w9NfyGCPAFtZQpaL@cluster0.vx7xmap.mongodb.net/"
DB_NAME = "cyber-crime"
INCIDENTS_COLLECTION = "incidents"
HOTSPOTS_COLLECTION = "hotspots"
ANALYTICS_COLLECTION = "analytics"
MAX_RECORDS = 10000

# ----------------------------
# CONNECT TO MONGO
# ----------------------------
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsAllowInvalidCertificates=False,
    serverSelectionTimeoutMS=20000,
    connectTimeoutMS=20000,
    maxPoolSize=50
)
db = client[DB_NAME]
incidents_collection = db[INCIDENTS_COLLECTION]
hotspots_collection = db[HOTSPOTS_COLLECTION]
analytics_collection = db[ANALYTICS_COLLECTION]

try:
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print("❌ MongoDB connection failed:", e)
    exit(1)

# ----------------------------
# STEP 1. LOAD CSV (FIRST 100)
# ----------------------------
print(f"📥 Loading CSV file: {CSV_FILE}")
df = pd.read_csv(CSV_FILE).head(MAX_RECORDS)
n_rows = len(df)
print(f"ℹ️ Loaded {n_rows} rows (capped at {MAX_RECORDS})")

# helper to check column presence
def ensure_column(df, col, default=""):
    if col not in df.columns:
        print(f"⚠️ Column '{col}' not found in CSV — creating with default values.")
        df[col] = default
    return df

df = ensure_column(df, "Content", default=np.nan)
df = ensure_column(df, "Label", default=np.nan)
# optional: ensure emocion_llm exists (used earlier)
df = ensure_column(df, "emocion_llm", default="")

# ----------------------------
# STEP 2. CORRUPT DATA (Simulate Real-World Mess)
# ----------------------------
def corrupt_text(text):
    """Simulate typos, extra spaces, and random symbols. Safe for non-strings."""
    if not isinstance(text, str) or len(text) < 3:
        return text
    corrupt_type = random.choice(["misspell", "extra_space", "symbols", "none"])
    if corrupt_type == "misspell":
        idx = random.randint(0, max(0, len(text) - 2))
        # remove one char and append a random char (simple misspelling)
        text = text[:idx] + text[idx+1:] + random.choice("abcdefghijklmnopqrstuvwxyz")
    elif corrupt_type == "extra_space":
        text = re.sub(r'(\s+)', '  ', text)
    elif corrupt_type == "symbols":
        text = text + random.choice(["!!", "@@", "##", "$$", "%%"])
    # "none" just returns original
    return text

def corrupt_dataset(df):
    df_corrupt = df.copy()
    n = len(df_corrupt)
    if n == 0:
        return df_corrupt

    # Random missing values (10%)
    for col in ["Content", "Label"]:
        mask = np.random.rand(n) < 0.1
        df_corrupt.loc[mask, col] = np.nan

    # Add duplicates (~5%) but ensure at least 1 duplication when possible
    frac = 0.05
    n_dup = max(1, int(frac * n)) if n > 1 else 0
    if n_dup > 0:
        dup_rows = df_corrupt.sample(n=n_dup, replace=False, random_state=42)
        df_corrupt = pd.concat([df_corrupt, dup_rows], ignore_index=True)

    # Text corruption — safe apply
    if "Content" in df_corrupt.columns:
        df_corrupt["Content"] = df_corrupt["Content"].apply(lambda x: corrupt_text(x) if pd.notnull(x) else x)

    return df_corrupt

df_raw = corrupt_dataset(df)
print(f"ℹ️ After corruption: {len(df_raw)} rows (may include duplicates)")

# ----------------------------
# STEP 3. CLEANING & FIXES
# ----------------------------
def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def preprocess_dataset(df):
    df_clean = df.copy()
    # if Content doesn't exist, create safe column
    if "Content" not in df_clean.columns:
        df_clean["Content"] = "unknown content"
    # remove exact duplicate content rows
    df_clean = df_clean.drop_duplicates(subset=["Content"], keep="first").reset_index(drop=True)
    df_clean["Content"] = df_clean["Content"].fillna("unknown content")
    df_clean["Label"] = df_clean["Label"].fillna("unknown")
    df_clean["Content"] = df_clean["Content"].apply(clean_text)
    df_clean["Label"] = df_clean["Label"].apply(lambda x: x.strip().lower() if isinstance(x, str) else "unknown")
    return df_clean

df_cleaned = preprocess_dataset(df_raw)
print(f"ℹ️ After cleaning: {len(df_cleaned)} rows")

# ----------------------------
# STEP 4. ANALYTICS (Missing%, Duplicates)
# ----------------------------
missing_percent = (df_raw.isnull().mean() * 100).to_dict()
duplicate_count = len(df_raw) - len(df_raw.drop_duplicates())
print("\n🧾 Data Quality Report:")
print(f"Missing % by Column: {missing_percent}")
print(f"Duplicate Rows: {duplicate_count}")

# ----------------------------
# STEP 5. MODEL EVALUATION
# ----------------------------
y_true = [str(label) for label in df_cleaned["Label"].tolist()]
y_pred = y_true.copy()

# Introduce 15% random label mismatches — only if there is more than one unique label
unique_labels = list(set(y_true))
if len(unique_labels) <= 1:
    # if there's only one label, we can't create realistic mismatches; simulate different labels instead
    # create an artificial second label to allow error injection
    unique_labels = unique_labels + ["other"]
    print("⚠️ Only one unique label found — simulating a second label for error injection.")

error_rate = 0.15
num_errors = int(len(y_pred) * error_rate)
for _ in range(num_errors):
    if len(y_pred) == 0:
        break
    idx = random.randint(0, len(y_pred) - 1)
    current_label = y_pred[idx]
    possible_labels = [lbl for lbl in unique_labels if lbl != current_label]
    if possible_labels:
        y_pred[idx] = random.choice(possible_labels)

# safe compute metrics (when lengths > 0)
accuracy = 0.0
f1 = 0.0
if len(y_true) == len(y_pred) and len(y_true) > 0:
    try:
        accuracy = accuracy_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred, average="weighted")
    except Exception as e:
        print("⚠️ Error computing metrics:", e)
        accuracy = 0.0
        f1 = 0.0

print("\n📊 Model Evaluation (Simulated Realistic):")
print(f"✅ Accuracy: {accuracy*100:.2f}%")
print(f"✅ F1 Score: {f1:.2f}")

# ----------------------------
# STEP 6. INSERT INTO MONGODB
# ----------------------------
severity_levels = ["Critical", "High", "Medium", "Low"]
# changed "Global" earlier — keep as-is or modify as you like
regions = ["Middle East", "North America", "Europe", "Asia Pacific", "South America", "Africa"]

def generate_ip():
    return f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}"

mapped_incidents = []
for _, row in df_cleaned.iterrows():
    severity = random.choice(severity_levels)
    incident = {
        "description": str(row.get("Content", "")),
        "severity": severity,
        "region": random.choice(regions),
        "timestamp": datetime.now() - timedelta(days=random.randint(0, 90)),
        "risk_score": min(100, max(0, random.randint(0, 20) + {"Critical": 95, "High": 80, "Medium": 60, "Low": 35}[severity])),
        "ip_address": generate_ip()
    }
    mapped_incidents.append(incident)

# safe clear & insert
incidents_collection.delete_many({})
hotspots_collection.delete_many({})
analytics_collection.delete_many({})
if mapped_incidents:
    incidents_collection.insert_many(mapped_incidents)
    print(f"✅ Inserted {len(mapped_incidents)} incidents into MongoDB.")
else:
    print("⚠️ No incidents to insert.")

# ----------------------------
# STEP 7. HOTSPOTS + ANALYTICS
# ----------------------------
region_data = defaultdict(list)
for inc in mapped_incidents:
    region_data[inc["region"]].append(inc)

hotspots = []
severity_map = {"Critical": 10, "High": 8, "Medium": 5, "Low": 3}
severity_counts = defaultdict(int)
severity_risks = defaultdict(list)

for inc in mapped_incidents:
    sev = inc["severity"]
    severity_counts[sev] += 1
    severity_risks[sev].append(inc["risk_score"])

for region, inc_list in region_data.items():
    count = len(inc_list)
    avg_severity = sum(severity_map.get(i["severity"], 5) for i in inc_list) / count if count > 0 else 0
    avg_risk = sum(i["risk_score"] for i in inc_list) / count if count > 0 else 0
    hotspots.append({
        "region": region,
        "incident_count": count,
        "avg_severity": round(avg_severity, 2),
        "risk_score": round(avg_risk, 2),
        "last_updated": datetime.now()
    })

if hotspots:
    hotspots_collection.insert_many(hotspots)
    print(f"✅ Inserted {len(hotspots)} hotspots.")
else:
    print("⚠️ No hotspots to insert.")

# --- Combined Chart Data (Severity vs Avg Risk)
severity_chart_data = []
for s, c in severity_counts.items():
    avg_r = float(np.mean(severity_risks[s])) if severity_risks[s] else 0.0
    severity_chart_data.append({"severity": s, "count": int(c), "avg_risk": round(avg_r, 2)})

# make everything serializable (convert defaultdicts to dicts)
analytics_doc = {
    "timestamp": datetime.now(),
    "accuracy": round(float(accuracy * 100), 2),
    "f1_score": round(float(f1), 2),
    "missing_percent": {k: float(v) for k, v in missing_percent.items()},
    "duplicate_count": int(duplicate_count),
    "severity_distribution": dict(severity_counts),
    "severity_risk_chart": severity_chart_data,
    "total_incidents": len(mapped_incidents),
}

analytics_collection.insert_one(analytics_doc)
print("✅ Analytics document inserted.")

# ----------------------------
# STEP 8. SUMMARY
# ----------------------------
print("\n" + "=" * 60)
print("📈 Final Database Analytics")
print("=" * 60)
print(f"🎯 Accuracy: {accuracy*100:.2f}%, F1: {f1:.2f}")
print(f"📁 Duplicates: {duplicate_count}")
print(f"🧮 Missing Data %: {missing_percent}")

print("\n🔥 Severity Summary:")
for s, c in severity_counts.items():
    avg_risk = float(np.mean(severity_risks[s])) if severity_risks[s] else 0.0
    print(f"  {s}: {c} incidents (Avg Risk: {avg_risk:.2f})")

print("\n🌍 Region Summary:")
for h in hotspots:
    print(f"  {h['region']}: {h['incident_count']} incidents (Risk: {h['risk_score']})")

print("\n✅ Data import, cleaning, and evaluation complete!")
client.close()
