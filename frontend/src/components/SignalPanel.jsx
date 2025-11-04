import { useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SignalPanel = ({ signals }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSignalColor = (state) => {
    switch (state) {
      case "GREEN":
        return "bg-green-500";
      case "YELLOW":
        return "bg-yellow-500";
      case "RED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="absolute bottom-[140px] right-4 z-[500] w-64">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          data-testid="signal-panel-toggle"
        >
          <div className="flex items-center gap-2">
            <Activity size={20} />
            <span className="font-bold text-sm">Traffic Signals</span>
          </div>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        {isExpanded && (
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto" data-testid="signal-panel-content">
            {signals.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">No signals available</p>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.signal_id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  data-testid={`signal-${signal.signal_id}`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{signal.location}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Density: {signal.traffic_density}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full ${getSignalColor(signal.current_state)} animate-pulse`}
                      data-testid={`signal-light-${signal.signal_id}`}
                    ></div>
                    <span className="text-xs font-bold text-gray-700">{signal.current_state}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalPanel;
