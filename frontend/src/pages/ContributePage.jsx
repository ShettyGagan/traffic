import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_API_URL;
const API = `${BACKEND_URL}/api`;

const ContributePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "traffic_jam",
    severity: "medium",
    description: "",
    lat: 12.9716,
    lng: 77.5946,
    reporter_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          toast.success("Location captured successfully!");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Using default location (Bangalore center)");
        }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit incident
      const response = await axios.post(`${API}/incidents`, formData);
      
      toast.success("Incident reported successfully! 🎉");
      toast.info("AI analyzing optimal routes...", { duration: 2000 });
      
      // Wait a moment for route analysis to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fetch route analysis
      try {
        const routeResponse = await axios.get(`${API}/incidents/${response.data.id}/routes`);
        
        // Show route suggestions
        const routes = routeResponse.data;
        toast.success(
          <div className="space-y-2">
            <p className="font-bold">✅ Route Analysis Complete!</p>
            <p className="text-xs">🛡️ Safe: {routes.safe_route}</p>
            <p className="text-xs">🌿 Eco: {routes.eco_route}</p>
            <p className="text-xs">⚡ Fast: {routes.fastest_route}</p>
          </div>,
          { duration: 5000 }
        );
      } catch (error) {
        console.error("Route analysis error:", error);
      }
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error reporting incident:", error);
      toast.error("Failed to report incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1" data-testid="back-btn">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Report Incident</h1>
            <p className="text-xs text-blue-100">Help keep the community safe</p>
          </div>
        </div>
      </div>

      {/* Community Banner */}
      <div className="mx-4 mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Community Safety Network</h2>
            <p className="text-sm text-blue-100 mt-1">Join thousands making Bangalore safer</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🚨 Real-time</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">👥 Community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Incident Type */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="type-section">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Incident Type</label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger className="w-full" data-testid="type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="traffic_jam" data-testid="type-traffic-jam">🚗 Traffic Jam</SelectItem>
              <SelectItem value="accident" data-testid="type-accident">💥 Accident</SelectItem>
              <SelectItem value="road_work" data-testid="type-road-work">🚧 Road Work</SelectItem>
              <SelectItem value="emergency" data-testid="type-emergency">🚨 Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Severity Level */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="severity-section">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-500" />
            <label className="text-sm font-semibold text-gray-700">Severity Level</label>
          </div>
          <p className="text-xs text-gray-500 mb-3">Select severity level</p>
          <Select
            value={formData.severity}
            onValueChange={(value) => setFormData({ ...formData, severity: value })}
          >
            <SelectTrigger className="w-full" data-testid="severity-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low" data-testid="severity-low">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Low
                </span>
              </SelectItem>
              <SelectItem value="medium" data-testid="severity-medium">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="high" data-testid="severity-high">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="description-section">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
          <Textarea
            placeholder="Describe the incident in detail"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-[100px] resize-none"
            data-testid="description-input"
          />
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="location-section">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-green-500" />
            <label className="text-sm font-semibold text-gray-700">Location</label>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-700 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Photo will be geotagged with current location
            </p>
            <p className="text-xs text-gray-600 mt-2" data-testid="location-coordinates">
              Lat: {formData.lat.toFixed(4)}, Lng: {formData.lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Photo Capture */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="photo-section">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={18} className="text-purple-500" />
            <label className="text-sm font-semibold text-gray-700">Capture Live Photo</label>
          </div>
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            data-testid="take-photo-btn"
          >
            <Camera size={18} className="mr-2" />
            Take Live Photo
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Photo capture feature (Coming soon - Mock for demo)
          </p>
        </div>

        {/* Reporter Name (Optional) */}
        <div className="bg-white rounded-2xl p-4 shadow-md" data-testid="reporter-section">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Your Name (Optional)</label>
          <input
            type="text"
            placeholder="Anonymous"
            value={formData.reporter_name}
            onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="reporter-name-input"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base py-6 rounded-2xl shadow-lg"
          data-testid="submit-report-btn"
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </form>
    </div>
  );
};

export default ContributePage;
