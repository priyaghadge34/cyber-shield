from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

MONGO_URI = "mongodb+srv://mayureshkahar777_db_user:w9NfyGCPAFtZQpaL@cluster0.vx7xmap.mongodb.net/"
DB_NAME = "cyber-crime"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Helper to safely convert MongoDB ObjectIds
def serialize_doc(doc):
    if not doc:
        return {}
    doc["_id"] = str(doc.get("_id", ""))
    return doc

@app.route("/analytics")
def get_analytics():
    try:
        analytics = db.analytics.find_one(sort=[("_id", -1)])
        if not analytics:
            return jsonify({"error": "No analytics data found"}), 404
        return jsonify(serialize_doc(analytics))
    except Exception as e:
        print("❌ Error in /analytics:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/incidents")
def get_incidents():
    try:
        incidents = list(db.incidents.find())
        if not incidents:
            return jsonify([])

        for i in incidents:
            i["_id"] = str(i.get("_id", ""))
            i["region"] = i.get("region", "Unknown")
            i["severity"] = i.get("severity", "Low")
            i["risk_score"] = i.get("risk_score", 0)
            i["description"] = i.get("description", "No description available")

        return jsonify(incidents)
    except Exception as e:
        print("❌ Error in /incidents:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Flask backend running at http://127.0.0.1:5000")
    app.run(debug=True)
