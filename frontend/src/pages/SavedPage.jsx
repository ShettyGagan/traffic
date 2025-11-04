import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const SavedPage = () => {
  const navigate = useNavigate();

  // Mock saved routes
  const savedRoutes = [
    {
      id: 1,
      title: "Home to Office",
      route: "via MG Road",
      distance: "8.5 km",
      time: "22 min",
      saved_at: "2 hours ago",
    },
    {
      id: 2,
      title: "Evening Route",
      route: "via Outer Ring Road",
      distance: "12.3 km",
      time: "28 min",
      saved_at: "Yesterday",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1" data-testid="back-btn">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Saved Routes</h1>
            <p className="text-xs text-blue-100">Your favorite routes</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {savedRoutes.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No saved routes yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-2xl p-4 shadow-md border border-gray-100"
                data-testid={`saved-route-${route.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{route.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-blue-500" />
                      <span>{route.route}</span>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        {route.distance}
                      </span>
                      <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                        {route.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Saved {route.saved_at}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-yellow-500"
                    data-testid={`unsave-btn-${route.id}`}
                  >
                    <Bookmark size={20} fill="currentColor" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SavedPage;
