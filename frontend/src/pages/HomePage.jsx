import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { AlertTriangle, Navigation, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import SignalPanel from "@/components/SignalPanel";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_API_URL;
const API = `${BACKEND_URL}/api`;

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (color) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

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
  const [popupIncident, setPopupIncident] = useState(null);
  const [stats, setStats] = useState({ total_incidents: 0, active_incidents: 0, high_severity_count: 0 });
  const routesRef = useRef(null);

  const defaultCenter = [12.9716, 77.5946];

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  useEffect(() => {
    fetchIncidents();
    fetchSignals();
    fetchStats();
    initializeSignals();

   
    const interval = setInterval(() => {
      if (!routesRef.current) {
        fetchIncidents();
        fetchStats();
      }
   
      fetchSignals();
    }, 5000);

    return () => clearInterval(interval);
  }, []); 

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

  const handleMarkerClick = async (incident) => {
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
      toast.success("Emergency vehicle detected! Signals updated for green wave.");
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
        description: `Simulated ${randomType} for testing`,
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
    <div className="relative h-screen w-screen bg-gray-50 overflow-y-auto">
      <div className="sticky top-0 z-[100] bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-md">
        <div className="flex items-center gap-2">
          <Navigation className="text-white" size={24} />
          <h1 className="text-xl font-bold text-white">Disha</h1>
        </div>
        <p className="text-xs text-blue-100">Smart & Safe Navigation</p>
      </div>

      <div className="sticky top-[72px] z-[100] bg-white border-b border-gray-200 px-4 py-2 flex justify-around text-center">
        <div>
          <p className="text-xs text-gray-600">Active</p>
          <p className="text-lg font-bold text-blue-600">{stats.active_incidents}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">High Severity</p>
          <p className="text-lg font-bold text-red-600">{stats.high_severity_count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold text-gray-800">{stats.total_incidents}</p>
        </div>
      </div>

      <div className="h-[50vh] border-b border-gray-200 relative">
        <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createCustomIcon(severityColors[incident.severity])}
              eventHandlers={{ click: () => handleMarkerClick(incident) }}
            >
              <Popup>
                <h3 className="font-semibold capitalize">{incident.type.replace("_", " ")}</h3>
                <p className="text-xs text-gray-600">{incident.description}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {routes && (
          <div className="absolute bottom-0 left-0 right-0 z-[200] bg-white shadow-2xl border-t border-gray-200 max-h-[35vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-blue-600" size={20} />
                <h3 className="font-bold text-gray-900">AI Route Suggestions</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4 bg-blue-50 p-2 rounded">{routes.ai_message}</p>

              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-green-900">Safety Route</p>
                      <p className="text-xs text-green-700">Avoids high-risk areas</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 ml-10">{routes.safe_route}</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">E</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-900">Eco Route</p>
                      <p className="text-xs text-blue-700">Environmentally friendly</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 ml-10">{routes.eco_route}</p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-orange-900">Fastest Route</p>
                      <p className="text-xs text-orange-700">Quickest arrival time</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 ml-10">{routes.fastest_route}</p>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setRoutes(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      
      <div className="min-h-screen p-4 space-y-3 bg-white pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-2">📰 Live Incident Feed</h2>

        {incidents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No active incidents right now 🚗</p>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition"
              onClick={() => setPopupIncident(incident)}
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="capitalize font-semibold text-gray-900">
                  {incident.type.replace("_", " ")}
                </h3>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    incident.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : incident.severity === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{incident.description}</p>
              <p className="text-xs text-gray-500">
                {incident.lat.toFixed(3)}, {incident.lng.toFixed(3)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Popup Incident Card */}
      {popupIncident && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-80 max-w-[90%] rounded-xl shadow-2xl border border-gray-200 p-4 relative animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setPopupIncident(null)}
            >
              ✖
            </button>

            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle
                size={20}
                className={`${
                  popupIncident.severity === "high"
                    ? "text-red-600"
                    : popupIncident.severity === "medium"
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              />
              <h3 className="font-bold text-gray-900 capitalize">
                {popupIncident.type.replace("_", " ")}
              </h3>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              {popupIncident.description || "No description provided."}
            </p>

            <span
              className={`inline-block mb-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                popupIncident.severity === "high"
                  ? "bg-red-100 text-red-700"
                  : popupIncident.severity === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {popupIncident.severity}
            </span>

            <p className="text-xs text-gray-500 mb-3">
               {popupIncident.lat.toFixed(3)}, {popupIncident.lng.toFixed(3)}
            </p>

            <div className="flex gap-2">
              <button
                className="flex-1 bg-blue-600 text-white py-1 rounded-md hover:bg-blue-700 text-sm"
                onClick={() => {
                  handleMarkerClick(popupIncident);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setPopupIncident(null);
                }}
              >
                View on Map
              </button>
              <button
                className="flex-1 bg-gray-100 text-gray-700 py-1 rounded-md hover:bg-gray-200 text-sm"
                onClick={() => setPopupIncident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signal Panel */}
      <SignalPanel signals={signals} />

      {/* Simulation Buttons */}
      <div className="absolute top-[150px] right-4 z-[500] space-y-2">
        <Button
          onClick={simulateAmbulance}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          size="sm"
        >
           Simulate Ambulance
        </Button>
        <Button
          onClick={simulateRandomIncident}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
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
