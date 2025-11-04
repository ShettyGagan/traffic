import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { AlertTriangle, Navigation, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import SignalPanel from "@/components/SignalPanel";
import { toast } from "sonner";

const BACKEND_URL =  import.meta.env.VITE_API_URL;
;
const API = `${BACKEND_URL}/api`;

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icons for different incident types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const severityColors = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

const HomePage = () => {
  const [incidents, setIncidents] = useState([]);
  const [signals, setSignals] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [stats, setStats] = useState({ total_incidents: 0, active_incidents: 0, high_severity_count: 0 });

  const defaultCenter = [12.9716, 77.5946]; // Bangalore

  useEffect(() => {
  if (routes) return; // pause refresh when viewing route suggestions

  const interval = setInterval(() => {
    fetchSignals();
    fetchStats();
    fetchIncidents();
  }, 5000);

  return () => clearInterval(interval);
}, [routes]);

  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API}/incidents?status=active`);
      setIncidents(response.data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  const fetchSignals = async () => {
    try {
      const response = await axios.get(`${API}/signals`);
      setSignals(response.data);
    } catch (error) {
      console.error("Error fetching signals:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const initializeSignals = async () => {
    try {
      await axios.post(`${API}/signals/initialize`);
    } catch (error) {
      console.error("Error initializing signals:", error);
    }
  };

  // const handleMarkerClick = async (incident) => {
  //   setSelectedIncident(incident);
  //   try {
  //     const response = await axios.get(`${API}/incidents/${incident.id}/routes`);
  //     setRoutes(response.data);
  //   } catch (error) {
  //     console.error("Error fetching routes:", error);
  //     toast.error("Unable to load route suggestions");
  //   }
  // };

  const handleMarkerClick = async (incident) => {
  // prevent re-fetching if same incident already selected
  if (selectedIncident?.id === incident.id && routes) {
    console.log("Skipping duplicate route fetch for same incident");
    return;
  }

  setSelectedIncident(incident);

  try {
    const response = await axios.get(`${API}/incidents/${incident.id}/routes`);
    setRoutes(response.data);
  } catch (error) {
    console.error("Error fetching routes:", error);
    toast.error("Unable to load route suggestions");
  }
};


  const simulateAmbulance = async () => {
    try {
      await axios.post(`${API}/simulate/traffic`, {
        road_id: "SILK_BOARD",
        traffic_density: 95,
        avg_speed: 15,
        emergency_vehicle_detected: true,
      });
      toast.success("🚨 Emergency vehicle detected! Signals updated for green wave.");
      fetchSignals();
    } catch (error) {
      console.error("Error simulating ambulance:", error);
    }
  };

  const simulateRandomIncident = async () => {
    const types = ["traffic_jam", "accident", "road_work"];
    const severities = ["low", "medium", "high"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

    const randomLat = 12.9716 + (Math.random() - 0.5) * 0.1;
    const randomLng = 77.5946 + (Math.random() - 0.5) * 0.1;

    try {
      await axios.post(`${API}/incidents`, {
        type: randomType,
        severity: randomSeverity,
        description: `Simulated ${randomType} incident for testing`,
        lat: randomLat,
        lng: randomLng,
        reporter_name: "System",
      });
      toast.success("Random incident created successfully!");
      fetchIncidents();
      fetchStats();
    } catch (error) {
      console.error("Error creating incident:", error);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-white" size={24} />
            <h1 className="text-xl font-bold text-white">Disha</h1>
          </div>
          <p className="text-xs text-blue-100 mt-0.5">Smart & Safe Navigation</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-[68px] left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-xs text-gray-600">Active Incidents</p>
            <p className="text-lg font-bold text-blue-600" data-testid="active-incidents-count">{stats.active_incidents}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">High Severity</p>
            <p className="text-lg font-bold text-red-600" data-testid="high-severity-count">{stats.high_severity_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Reports</p>
            <p className="text-lg font-bold text-gray-800" data-testid="total-incidents-count">{stats.total_incidents}</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute top-[128px] left-0 right-0 bottom-[140px] z-10">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createCustomIcon(severityColors[incident.severity])}
              eventHandlers={{
                click: () => handleMarkerClick(incident),
              }}
              data-testid={`incident-marker-${incident.id}`}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm capitalize">{incident.type.replace("_", " ")}</h3>
                  <p className="text-xs text-gray-600 mt-1">{incident.description}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                    incident.severity === "high" ? "bg-red-100 text-red-700" :
                    incident.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {incident.severity}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Route Display */}
      {routes && (
        <div className="absolute bottom-[140px] left-0 right-0 z-[500] bg-white shadow-2xl border-t border-gray-200 max-h-[40vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-blue-600" size={20} />
              <h3 className="font-bold text-gray-900">AI Route Suggestions</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4 bg-blue-50 p-2 rounded" data-testid="ai-message">{routes.ai_message}</p>

            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200" data-testid="safe-route-card">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🛡️</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-green-900">Safety Route</p>
                    <p className="text-xs text-green-700">Avoids high-risk areas</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 ml-10" data-testid="safe-route-text">{routes.safe_route}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200" data-testid="eco-route-card">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🍃</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-blue-900">Eco Route</p>
                    <p className="text-xs text-blue-700">Environmentally friendly</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 ml-10" data-testid="eco-route-text">{routes.eco_route}</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200" data-testid="fastest-route-card">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">⚡</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-orange-900">Fastest Route</p>
                    <p className="text-xs text-orange-700">Quickest arrival time</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 ml-10" data-testid="fastest-route-text">{routes.fastest_route}</p>
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setRoutes(null)}
              data-testid="close-routes-btn"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Signal Panel */}
      <SignalPanel signals={signals} />

      {/* Simulation Buttons */}
      <div className="absolute top-[140px] right-4 z-[500] space-y-2">
        <Button
          onClick={simulateAmbulance}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          size="sm"
          data-testid="simulate-ambulance-btn"
        >
          🚑 Simulate Ambulance
        </Button>
        <Button
          onClick={simulateRandomIncident}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
          data-testid="simulate-incident-btn"
        >
          <Activity size={16} className="mr-1" />
          Random Incident
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default HomePage;
