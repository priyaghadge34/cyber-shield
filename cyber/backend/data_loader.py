"""
Optimized FastAPI Server for Cybercrime Pattern Recognition
Includes all features required by the frontend dashboard
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pandas as pd
from pymongo import MongoClient, ASCENDING, DESCENDING
import random
import sys
import io
import re
from collections import Counter

# ----------------------------
# APP INITIALIZATION
# ----------------------------
app = FastAPI(title="Cybercrime Analytics API", version="3.0")

# ----------------------------
# CORS (Frontend Communication)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# MongoDB Connection
# ----------------------------
try:
    client = MongoClient(
        "mongodb+srv://mayureshkahar777_db_user:w9NfyGCPAFtZQpaL@cluster0.vx7xmap.mongodb.net/",
        maxPoolSize=50,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000
    )
    db = client["cyber-crime"]
    incidents_collection = db["incidents"]
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    sys.exit(1)

# ----------------------------
# CACHE SETTINGS
# ----------------------------
cache = {"stats": None, "last_updated": None}
CACHE_DURATION = timedelta(minutes=5)

# ----------------------------
# HELPER FUNCTIONS
# ----------------------------
def random_severity():
    return random.choice(["Critical", "High", "Medium", "Low"])

def random_region():
    return random.choice(["North America", "Europe", "Asia Pacific", "South America", "Africa", "Global"])

def calculate_risk_score(severity: str) -> float:
    weights = {"Critical": 95, "High": 80, "Medium": 60, "Low": 35}
    return weights.get(severity, 50) + random.uniform(0, 10)

def random_sector():
    return random.choice(["Finance", "Healthcare", "Retail", "Technology", "Government", "Education"])

def clean_text(text):
    """Clean text for keyword extraction"""
    text = str(text).lower()
    text = re.sub(r'[^a-z\s]', '', text)
    return text

def extract_keywords(descriptions, top_n=15):
    """Extract top keywords from descriptions"""
    all_words = []
    for desc in descriptions:
        all_words.extend(clean_text(desc).split())
    
    stopwords = {"the", "is", "and", "to", "in", "of", "on", "a", "for", "with", "at", "by", "from", "as", "it"}
    filtered_words = [w for w in all_words if w not in stopwords and len(w) > 3]
    return dict(Counter(filtered_words).most_common(top_n))

# ----------------------------
# DATABASE INDEXING
# ----------------------------
@app.on_event("startup")
async def create_indexes():
    print("🔧 Creating database indexes...")
    try:
        incidents_collection.create_index([("timestamp", DESCENDING)])
        incidents_collection.create_index([("crime_type", ASCENDING)])
        incidents_collection.create_index([("severity", ASCENDING)])
        incidents_collection.create_index([("risk_score", DESCENDING)])
        incidents_collection.create_index([("region", ASCENDING)])
        print("✅ Indexes created successfully!")
    except Exception as e:
        print(f"⚠️ Index creation error: {e}")

# ----------------------------
# CSV UPLOAD ENDPOINT
# ----------------------------
@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and process CSV file"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Clear existing data
        incidents_collection.delete_many({})
        
        incidents = []
        for _, row in df.iterrows():
            severity = random_severity()
            random_day = random.randint(1, 90)
            
            incident = {
                "crime_type": row.get("Label", "Unknown"),
                "description": row.get("Content", ""),
                "cleaned_text": clean_text(row.get("Content", "")),
                "severity": severity,
                "region": random_region(),
                "target_sector": random_sector(),
                "risk_score": calculate_risk_score(severity),
                "timestamp": datetime.now() - timedelta(days=random_day),
            }
            incidents.append(incident)
        
        if incidents:
            incidents_collection.insert_many(incidents)
            return {"status": "success", "message": f"✅ Uploaded {len(incidents)} records successfully"}
        
        return {"status": "error", "message": "No valid records found"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ----------------------------
# ROOT ENDPOINT
# ----------------------------
@app.get("/")
async def root():
    total = incidents_collection.count_documents({})
    return {
        "message": "✅ Cybercrime Pattern Recognition API",
        "version": "3.0",
        "total_incidents": total,
        "docs": "/docs",
    }

# ----------------------------
# DASHBOARD ENDPOINT (Main API for Frontend)
# ----------------------------
@app.get("/dashboard")
async def get_dashboard():
    """Returns complete analytics for frontend dashboard"""
    global cache

    # Serve cached data if recent
    if cache["stats"] and cache["last_updated"] and datetime.now() - cache["last_updated"] < CACHE_DURATION:
        return {"status": "success", "data": cache["stats"]}

    try:
        total = incidents_collection.count_documents({})
        
        if total == 0:
            return {
                "status": "success", 
                "data": {
                    "total_incidents": 0,
                    "recent_incidents": 0,
                    "avg_risk_score": 0,
                    "confidence": 0,
                    "risk_ratio": 0,
                    "trend": "No data",
                    "f1_score": 0,
                    "severity_distribution": {},
                    "hotspots": [],
                    "trending_keywords": [],
                    "keyword_patterns": {},
                    "trends_over_time": []
                }
            }
        
        recent_threshold = datetime.now() - timedelta(days=30)
        recent = incidents_collection.count_documents({"timestamp": {"$gte": recent_threshold}})

        # Average risk score
        avg_result = list(incidents_collection.aggregate([
            {"$group": {"_id": None, "avg_score": {"$avg": "$risk_score"}}}
        ]))
        avg_risk = round(avg_result[0]["avg_score"], 2) if avg_result else 0

        # Severity Distribution
        severity_data = list(incidents_collection.aggregate([
            {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]))
        severity_dist = {item["_id"]: item["count"] for item in severity_data}

        # Region Hotspots
        hotspot_data = list(incidents_collection.aggregate([
            {"$group": {"_id": "$region", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]))
        hotspots = [
            {"region": item["_id"], "incident_count": item["count"]}
            for item in hotspot_data
        ]

        # Extract keywords from descriptions
        all_descriptions = [
            doc["description"] 
            for doc in incidents_collection.find({}, {"description": 1, "_id": 0})
        ]
        keyword_patterns = extract_keywords(all_descriptions)
        trending_keywords = list(keyword_patterns.keys())[:5]

        # Monthly trends
        timeline_data = list(incidents_collection.aggregate([
            {"$group": {
                "_id": {
                    "month": {"$month": "$timestamp"}, 
                    "year": {"$year": "$timestamp"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]))
        trends_over_time = [
            {
                "month": f"{d['_id']['month']}/{d['_id']['year']}", 
                "count": d["count"]
            } 
            for d in timeline_data
        ]

        # AI metrics (simulated)
        confidence = round(random.uniform(85, 98), 1)
        f1_score = round(random.uniform(0.82, 0.94), 2)
        
        # Calculate risk ratio
        critical_high = severity_dist.get("Critical", 0) + severity_dist.get("High", 0)
        risk_ratio = round((critical_high / total) * 100, 1) if total > 0 else 0
        
        # Determine trend
        if len(trends_over_time) >= 2:
            recent_count = trends_over_time[-1]["count"]
            prev_count = trends_over_time[-2]["count"]
            if recent_count > prev_count:
                trend = "↑ Increasing"
            elif recent_count < prev_count:
                trend = "↓ Decreasing"
            else:
                trend = "→ Stable"
        else:
            trend = "→ Stable"

        # Prepare complete response
        stats = {
            "total_incidents": total,
            "recent_incidents": recent,
            "avg_risk_score": avg_risk,
            "confidence": confidence,
            "risk_ratio": risk_ratio,
            "trend": trend,
            "f1_score": f1_score,
            "severity_distribution": severity_dist,
            "hotspots": hotspots,
            "trending_keywords": trending_keywords,
            "keyword_patterns": keyword_patterns,
            "trends_over_time": trends_over_time,
        }

        # Cache results
        cache["stats"] = stats
        cache["last_updated"] = datetime.now()

        return {"status": "success", "data": stats}
        
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        return {"status": "error", "error": str(e)}

# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.get("/api/health")
async def health_check():
    try:
        client.admin.command("ping")
        count = incidents_collection.count_documents({})
        return {
            "status": "healthy",
            "total_incidents": count,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == "__main__":
    print("🚀 Starting Cybercrime Pattern Recognition API...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)