import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Award, MapPin, Settings } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  const navigate = useNavigate();

  const userStats = {
    reports_submitted: 12,
    helpful_votes: 45,
    rank: "Community Hero",
    member_since: "Jan 2025",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1" data-testid="back-btn">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-xs text-blue-100">Your community stats</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Community Member</h2>
              <p className="text-sm text-blue-100 mt-1">{userStats.rank}</p>
              <p className="text-xs text-blue-200 mt-1">Member since {userStats.member_since}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-md text-center" data-testid="reports-card">
            <MapPin size={32} className="mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{userStats.reports_submitted}</p>
            <p className="text-xs text-gray-600 mt-1">Reports Submitted</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center" data-testid="votes-card">
            <Award size={32} className="mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{userStats.helpful_votes}</p>
            <p className="text-xs text-gray-600 mt-1">Helpful Votes</p>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-left"
            data-testid="settings-btn"
          >
            <Settings size={20} />
            <div>
              <p className="font-medium">Settings</p>
              <p className="text-xs text-gray-500">Manage your preferences</p>
            </div>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
