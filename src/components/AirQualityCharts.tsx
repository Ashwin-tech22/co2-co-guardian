import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

interface Props {
  readings: Reading[];
}

const AirQualityCharts = ({ readings }: Props) => {
  if (readings.length === 0) {
    return (
      <Card className="p-8 shadow-card">
        <p className="text-center text-muted-foreground">
          No historical data available yet. Data will appear as sensors send readings.
        </p>
      </Card>
    );
  }

  // Prepare data for charts (reverse to show oldest first)
  const chartData = [...readings]
    .reverse()
    .slice(-50) // Last 50 readings
    .map((reading) => ({
      time: new Date(reading.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      co2: reading.co2_level,
      co: reading.co_level,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* CO2 Chart */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          CO₂ Levels Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'ppm', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="co2" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1}
              fill="url(#colorCo2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Safe Range:</strong> Below 1000 ppm
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Current:</strong> {readings[0].co2_level.toFixed(1)} ppm
          </p>
        </div>
      </Card>

      {/* CO Chart */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          CO Levels Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'ppm', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="co" 
              stroke="hsl(var(--accent))" 
              fillOpacity={1}
              fill="url(#colorCo)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-accent/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Safe Range:</strong> Below 9 ppm
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Current:</strong> {readings[0].co_level.toFixed(1)} ppm
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AirQualityCharts;
