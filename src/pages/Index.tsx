import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AirQualityMetrics from "@/components/AirQualityMetrics";
import AirQualityCharts from "@/components/AirQualityCharts";
import HealthImpact from "@/components/HealthImpact";
import ReductionSuggestions from "@/components/ReductionSuggestions";
import FineCalculator from "@/components/FineCalculator";
import ThreeBackground from "@/components/ThreeBackground";
import { Wind, Activity, TestTube, IndianRupee, LogOut } from "lucide-react";



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

    // Set up polling as backup
    const pollInterval = setInterval(fetchReadings, 5000);

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
          console.log('⚡ Real-time update received:', newReading);
          setReadings(prev => [newReading, ...prev].slice(0, 100));
          setLatestReading(newReading);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      clearInterval(pollInterval);
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
      console.log('📊 Latest reading from DB:', data[0]);
      setReadings(data);
      setLatestReading(data[0]);
    }
  };

  const testDataSend = async () => {
    const testData = {
      co2_level: Math.floor(Math.random() * 1000) + 400,
      co_level: Math.floor(Math.random() * 50) + 10
    };
    
    console.log('🧪 Sending test data:', testData);
    
    const { data, error } = await supabase.functions.invoke('receive-sensor-data', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Test data error:', error);
    } else {
      console.log('✅ Test data sent successfully:', data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg relative">
      <ThreeBackground />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-primary shadow-glow animate-float">
                <Wind className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground animate-fade-in-up">
                  CO2 & CO Guardian
                </h1>
                <p className="text-muted-foreground animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  Real-time Air Quality Monitoring & Health Protection
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => supabase.auth.signOut()}
              className="gap-2 hover-lift btn-animate"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
       
        

        {/* Current Metrics */}
        <div className="animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <AirQualityMetrics latestReading={latestReading} />
        </div>

        {/* Tabs for Different Sections */}
        <Tabs defaultValue="charts" className="mt-8 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto hover-lift">
            <TabsTrigger value="charts" className="hover-scale">
              <Activity className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="health" className="hover-scale">Health Impact</TabsTrigger>
            <TabsTrigger value="suggestions" className="hover-scale">Reduce Pollution</TabsTrigger>
            <TabsTrigger value="fines" className="hover-scale">
              <IndianRupee className="h-4 w-4 mr-2" />
              Fines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6 animate-fade-in-up">
            <AirQualityCharts readings={readings} />
          </TabsContent>

          <TabsContent value="health" className="mt-6 animate-fade-in-up">
            <HealthImpact latestReading={latestReading} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6 animate-fade-in-up">
            <ReductionSuggestions latestReading={latestReading} />
          </TabsContent>

          <TabsContent value="fines" className="mt-6 animate-fade-in-up">
            <FineCalculator latestReading={latestReading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
