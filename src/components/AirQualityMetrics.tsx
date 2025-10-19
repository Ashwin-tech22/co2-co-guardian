import { Card } from "@/components/ui/card";
import { Wind, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

interface Props {
  latestReading: Reading | null;
}

const getAirQualityLevel = (co2: number, co: number) => {
  // CO2 levels: <400 excellent, 400-1000 good, 1000-2000 moderate, >2000 poor
  // CO levels: <9 good, 9-35 moderate, >35 unhealthy
  
  if (co2 > 2000 || co > 35) {
    return { level: "Poor", color: "destructive", gradient: "gradient-danger" };
  } else if (co2 > 1000 || co > 9) {
    return { level: "Moderate", color: "warning", gradient: "gradient-warning" };
  } else if (co2 > 400 || co > 0) {
    return { level: "Good", color: "success", gradient: "gradient-success" };
  }
  return { level: "Excellent", color: "primary", gradient: "gradient-primary" };
};

const AirQualityMetrics = ({ latestReading }: Props) => {
  if (!latestReading) {
    return (
      <Card className="p-8 shadow-card animate-fade-in">
        <div className="text-center text-muted-foreground">
          <Wind className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Waiting for sensor data...</p>
          <p className="text-sm mt-2">Your ESP32 will send data shortly</p>
        </div>
      </Card>
    );
  }

  const quality = getAirQualityLevel(latestReading.co2_level, latestReading.co_level);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Overall Air Quality */}
      <Card className={cn(
        "p-6 shadow-card border-2 transition-all duration-300",
        quality.color === "destructive" && "border-destructive",
        quality.color === "warning" && "border-warning",
        quality.color === "success" && "border-success",
        quality.color === "primary" && "border-primary"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Air Quality</h3>
          {quality.level === "Poor" && (
            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
          )}
        </div>
        <div className={cn(
          "text-4xl font-bold mb-2",
          quality.color === "destructive" && "text-destructive",
          quality.color === "warning" && "text-warning",
          quality.color === "success" && "text-success",
          quality.color === "primary" && "text-primary"
        )}>
          {quality.level}
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(latestReading.timestamp).toLocaleTimeString()}
        </p>
      </Card>

      {/* CO2 Level */}
      <Card className="p-6 shadow-card hover-scale transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">CO₂ Level</h3>
          <div className="p-2 rounded-lg bg-primary/10">
            <Wind className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="text-4xl font-bold text-foreground mb-1">
          {latestReading.co2_level.toFixed(1)}
        </div>
        <p className="text-sm text-muted-foreground">ppm (parts per million)</p>
      </Card>

      {/* CO Level */}
      <Card className="p-6 shadow-card hover-scale transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">CO Level</h3>
          <div className="p-2 rounded-lg bg-accent/10">
            <AlertTriangle className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="text-4xl font-bold text-foreground mb-1">
          {latestReading.co_level.toFixed(1)}
        </div>
        <p className="text-sm text-muted-foreground">ppm (parts per million)</p>
      </Card>
    </div>
  );
};

export default AirQualityMetrics;
