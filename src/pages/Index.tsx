import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AirQualityMetrics from "@/components/AirQualityMetrics";
import AirQualityCharts from "@/components/AirQualityCharts";
import HealthImpact from "@/components/HealthImpact";
import ReductionSuggestions from "@/components/ReductionSuggestions";
import { Wind, Activity } from "lucide-react";

interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

const Index = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [latestReading, setLatestReading] = useState<Reading | null>(null);

  useEffect(() => {
    // Fetch initial data
    fetchReadings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('air-quality-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'air_quality_readings'
        },
        (payload) => {
          const newReading = payload.new as Reading;
          setReadings(prev => [newReading, ...prev].slice(0, 100));
          setLatestReading(newReading);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReadings = async () => {
    const { data, error } = await supabase
      .from('air_quality_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching readings:', error);
      return;
    }

    if (data && data.length > 0) {
      setReadings(data);
      setLatestReading(data[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
              <Wind className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                CO2 & CO Guardian
              </h1>
              <p className="text-muted-foreground">
                Real-time Air Quality Monitoring & Health Protection
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Current Metrics */}
        <AirQualityMetrics latestReading={latestReading} />

        {/* Tabs for Different Sections */}
        <Tabs defaultValue="charts" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="charts">
              <Activity className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="health">Health Impact</TabsTrigger>
            <TabsTrigger value="suggestions">Reduce Pollution</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <AirQualityCharts readings={readings} />
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <HealthImpact latestReading={latestReading} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <ReductionSuggestions latestReading={latestReading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
