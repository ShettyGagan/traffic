from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import random
import asyncio
import google.generativeai as genai
import openrouteservice

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


app = FastAPI()

api_router = APIRouter(prefix="/api")


class Incident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  
    severity: str  
    description: str
    lat: float
    lng: float
    photo_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous"
    status: str = "active"  
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IncidentCreate(BaseModel):
    type: str
    severity: str
    description: str
    lat: float
    lng: float
    photo_url: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous"

class RouteAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    incident_id: str
    safe_route: str
    eco_route: str
    fastest_route: str
    ai_message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrafficSignal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    signal_id: str
    location: str
    lat: float
    lng: float
    current_state: str 
    traffic_density: int  
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrafficSimulation(BaseModel):
    road_id: str
    traffic_density: int
    avg_speed: float
    emergency_vehicle_detected: bool = False



class RouteAnalysisAgent:
    """
    Intelligent Route Analysis Agent
    Analyzes incident data and provides optimal alternate routes
    
    Integration Ready:
    1. Hugging Face API for AI-powered route reasoning
    2. OpenRouteService for actual route calculations
    3. Traffic density data from simulation
    """
    
    def __init__(self):
        self.gemini_api_key = os.environ.get('GEMINI_API_KEY')
        self.ors_api_key = os.environ.get('ORS_API_KEY')
        self.use_mock = not (self.gemini_api_key and self.ors_api_key)
        
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)

        if self.ors_api_key:
            self.ors_client = openrouteservice.Client(key=self.ors_api_key)


    async def analyze_incident(self, incident: Incident, traffic_signals: list = None) -> RouteAnalysis:
        """
        Main analysis method - orchestrates route calculation
        """
        if self.use_mock:
            return await self._mock_analysis(incident)
        else:
            return await self._real_analysis(incident, traffic_signals)
    
    #mock analysis
    async def _mock_analysis(self, incident: Incident) -> RouteAnalysis:
        
       
        await asyncio.sleep(0.5)
        
        
        context = self._analyze_incident_context(incident)
        
        
        route_options = self._get_contextual_routes(incident)
        
        
        distances = {
            "safe": round(random.uniform(10, 15), 1),
            "eco": round(random.uniform(8, 12), 1),
            "fast": round(random.uniform(6, 10), 1),
        }
        
        
        ai_message = self._generate_ai_message(incident, context)
        
        return RouteAnalysis(
            incident_id=incident.id,
            safe_route=f"{route_options['safe']}, {distances['safe']} km (Safest, avoids high-risk zones)",
            eco_route=f"{route_options['eco']}, {distances['eco']} km (Eco-friendly, lower emissions)",
            fastest_route=f"{route_options['fast']}, {distances['fast']} km (Quickest arrival time)",
            ai_message=ai_message
        )
    
    async def _real_analysis(self, incident: Incident, traffic_signals: list) -> RouteAnalysis:
        try:
            start_coords = (incident.lng - 0.02, incident.lat - 0.02)
            end_coords = (incident.lng + 0.02, incident.lat + 0.02)

            
            if self.ors_api_key:
                try:
                    ors_result = self.ors_client.directions(
                        coordinates=[start_coords, end_coords],
                        profile="driving-car",
                        format="geojson"
                    )
                    safe_route_summary = "Route generated successfully using ORS"
                except Exception as inner_e:
                    safe_route_summary = f"OpenRouteService error: {inner_e}"
                    ors_result = None
            else:
                safe_route_summary = "OpenRouteService not configured; using mock routes"
                ors_result = None

        except Exception as e:
            safe_route_summary = f"Unexpected error preparing ORS request: {e}"
            ors_result = None

        prompt = f"""
        Traffic Incident Analysis:
        Type: {incident.type}
        Severity: {incident.severity}
        Location: Lat {incident.lat}, Lng {incident.lng}
        Description: {incident.description}
        
        Analyze this incident and suggest:
        1. Safest alternate route (avoiding high-risk areas)
        2. Most eco-friendly route (lower emissions)
        3. Fastest route (quickest arrival)
        
        Consider traffic density and emergency vehicle priority.
        """
        
        ai_message=await self.ask_gemini(prompt)

        return RouteAnalysis(
            incident_id=incident.id,
            safe_route=f"ORS safe route: {safe_route_summary}",
            eco_route="Eco-friendly route suggestion based on current density.",
            fastest_route="Fastest route with least congestion delay.",
            ai_message=ai_message,
        )
    
    async def ask_gemini(self, prompt: str) -> str:
        """
        Send prompt to Gemini model and return AI reasoning text.
        """
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            return response.text or "No response from Gemini."
        except Exception as e:
            return f"Error with Gemini API: {e}"

        
        # return await self._mock_analysis(incident)
    
    def _analyze_incident_context(self, incident: Incident) -> dict:
        """Analyze incident characteristics"""
        return {
            "urgency": "high" if incident.severity == "high" else "medium" if incident.severity == "medium" else "low",
            "area_affected": "major" if incident.type in ["accident", "emergency"] else "moderate",
            "duration_estimate": "2+ hours" if incident.severity == "high" else "30-60 min",
        }
    
    def _get_contextual_routes(self, incident: Incident) -> dict:
        """Generate context-aware route suggestions"""
        # Route suggestions based on location and incident type
        route_sets = {
            "accident": {
                "safe": "via Outer Ring Road (avoiding accident zone)",
                "eco": "via Sarjapur Road (tree-lined route)",
                "fast": "via Electronic City Flyover"
            },
            "traffic_jam": {
                "safe": "via Old Airport Road",
                "eco": "via Double Road",
                "fast": "via MG Road"
            },
            "road_work": {
                "safe": "via Hennur Road",
                "eco": "via Bellary Road",
                "fast": "via Hebbal Flyover"
            },
            "emergency": {
                "safe": "via Hospital Route (NH-7)",
                "eco": "via Inner Ring Road",
                "fast": "via Elevated Highway (green wave activated)"
            }
        }
        
        return route_sets.get(incident.type, route_sets["traffic_jam"])
    
    def _generate_ai_message(self, incident: Incident, context: dict) -> str:
        """Generate contextual AI message"""
        severity_prefix = {
            "low": "ℹ️ Advisory: ",
            "medium": "⚠️ Caution: ",
            "high": "🚨 Alert: "
        }
        
        incident_messages = {
            "accident": f"Accident detected at location. Estimated clearance time: {context['duration_estimate']}. Emergency services en route.",
            "traffic_jam": f"Heavy congestion reported. Traffic density above normal. Consider alternate routes.",
            "road_work": f"Road construction in progress. Lane restrictions active. Plan additional travel time.",
            "emergency": f"EMERGENCY SITUATION! Avoid area immediately. Traffic signals adjusted for emergency vehicles."
        }
        
        base_message = incident_messages.get(incident.type, "Traffic disruption detected.")
        
        return severity_prefix.get(incident.severity, "") + base_message

# analysis agent
route_agent = RouteAnalysisAgent()



@api_router.post("/incidents", response_model=Incident)
async def create_incident(input: IncidentCreate):
    
    incident_obj = Incident(**input.model_dump())
    
    doc = incident_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.incidents.insert_one(doc)
    
    
    logger.info(f"Analyzing incident {incident_obj.id} with RouteAnalysisAgent")
    
    # Get current traffic signals 
    signals = await db.traffic_signals.find({}, {"_id": 0}).to_list(100)
    
    # Runing analysis
    route_analysis = await route_agent.analyze_incident(incident_obj, signals)
    
    # Store analysis results
    route_doc = route_analysis.model_dump()
    route_doc['timestamp'] = route_doc['timestamp'].isoformat()
    await db.route_analyses.insert_one(route_doc)
    
    logger.info(f"Route analysis complete for incident {incident_obj.id}")
    
    # Updating traffic signals if high severity
    if incident_obj.severity == "high":
        await update_signals_for_emergency(incident_obj.lat, incident_obj.lng)
        logger.warning(f"High severity incident! Emergency signal protocol activated.")
    
    return incident_obj

@api_router.get("/incidents", response_model=List[Incident])
async def get_incidents(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    
    incidents = await db.incidents.find(query, {"_id": 0}).to_list(1000)
    
    for incident in incidents:
        if isinstance(incident['timestamp'], str):
            incident['timestamp'] = datetime.fromisoformat(incident['timestamp'])
    
    return incidents

@api_router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    incident = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if isinstance(incident['timestamp'], str):
        incident['timestamp'] = datetime.fromisoformat(incident['timestamp'])
    
    return incident

@api_router.get("/incidents/{incident_id}/routes", response_model=RouteAnalysis)
async def get_incident_routes(incident_id: str):
    route = await db.route_analyses.find_one({"incident_id": incident_id}, {"_id": 0})
    
    if not route:
        raise HTTPException(status_code=404, detail="Route analysis not found")
    
    if isinstance(route['timestamp'], str):
        route['timestamp'] = datetime.fromisoformat(route['timestamp'])
    
    return route


@api_router.get("/signals", response_model=List[TrafficSignal])
async def get_signals():
    signals = await db.traffic_signals.find({}, {"_id": 0}).to_list(100)
    
    for signal in signals:
        if isinstance(signal['last_updated'], str):
            signal['last_updated'] = datetime.fromisoformat(signal['last_updated'])
    
    return signals

@api_router.post("/signals/initialize")
async def initialize_signals():
    """
    Initialize demo traffic signals for Bangalore roads
    """
    signals = [
        {"signal_id": "MG_ROAD", "location": "MG Road Junction", "lat": 12.9716, "lng": 77.5946, "current_state": "GREEN", "traffic_density": 45},
        {"signal_id": "HOSUR_ROAD", "location": "Hosur Road Signal", "lat": 12.9352, "lng": 77.6245, "current_state": "GREEN", "traffic_density": 55},
        {"signal_id": "OUTER_RING", "location": "Outer Ring Road", "lat": 12.9899, "lng": 77.7156, "current_state": "GREEN", "traffic_density": 30},
        {"signal_id": "HEBBAL", "location": "Hebbal Flyover", "lat": 13.0359, "lng": 77.5971, "current_state": "GREEN", "traffic_density": 68},
        {"signal_id": "SILK_BOARD", "location": "Silk Board Junction", "lat": 12.9165, "lng": 77.6223, "current_state": "RED", "traffic_density": 85},
    ]
    
    for signal in signals:
        signal['last_updated'] = datetime.now(timezone.utc).isoformat()
        await db.traffic_signals.update_one(
            {"signal_id": signal['signal_id']},
            {"$set": signal},
            upsert=True
        )
    
    return {"message": "Traffic signals initialized", "count": len(signals)}

@api_router.post("/simulate/traffic")
async def simulate_traffic(sim: TrafficSimulation):
    
    signal = await db.traffic_signals.find_one({"signal_id": sim.road_id})
    
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Determining signal state based on traffic density
    if sim.emergency_vehicle_detected:
        new_state = "GREEN"  
    elif sim.traffic_density > 80:
        new_state = "RED"
    elif sim.traffic_density > 50:
        new_state = "YELLOW"
    else:
        new_state = "GREEN"
    
    await db.traffic_signals.update_one(
        {"signal_id": sim.road_id},
        {"$set": {
            "current_state": new_state,
            "traffic_density": sim.traffic_density,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"signal_id": sim.road_id, "new_state": new_state, "density": sim.traffic_density}

async def update_signals_for_emergency(lat: float, lng: float):
    
    
    await db.traffic_signals.update_many(
        {"traffic_density": {"$gt": 70}},
        {"$set": {
            "current_state": "GREEN",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }}
    )

@api_router.get("/stats")
async def get_stats():
    total_incidents = await db.incidents.count_documents({})
    active_incidents = await db.incidents.count_documents({"status": "active"})
    high_severity = await db.incidents.count_documents({"severity": "high", "status": "active"})
    
    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "high_severity_count": high_severity
    }



@api_router.get("/")
async def root():
    return {"message": "Disha - Smart Traffic Management API", "version": "1.0.0"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
