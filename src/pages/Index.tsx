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
import { mqttClient } from "@/services/mqttClient";
import { insertSensorData, getLatestReadings } from "@/services/dataService";
import { Wind, Activity, TestTube, IndianRupee } from "lucide-react";



interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

const Index = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [latestReading, setLatestReading] = useState<Reading | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [mqttStatus, setMqttStatus] = useState('Disconnected');

  useEffect(() => {
    fetchReadings();
    const pollInterval = setInterval(fetchReadings, 5000);
    
    const mqttStatusInterval = setInterval(() => {
      setMqttStatus(mqttClient.isConnected() ? 'Connected' : 'Disconnected');
    }, 2000);

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
          console.log('📡 New sensor data received:', newReading);
          setReadings(prev => [newReading, ...prev].slice(0, 100));
          setLatestReading(newReading);
        }
      )
      .subscribe((status) => {
        console.log('🔗 Realtime connection status:', status);
        setConnectionStatus(status);
      });

    return () => {
      clearInterval(pollInterval);
      clearInterval(mqttStatusInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReadings = async () => {
    const result = await getLatestReadings(100);
    if (result.success && result.data && result.data.length > 0) {
      setReadings(result.data);
      setLatestReading(result.data[0]);
    }
  };

  const testDataSend = async () => {
    const testData = {
      co2_level: Math.floor(Math.random() * 1000) + 400,
      co_level: Math.floor(Math.random() * 50) + 10
    };
    
    console.log('🧪 Sending test data:', testData);
    const result = await insertSensorData(testData.co2_level, testData.co_level);
    
    if (result.success) {
      console.log('✅ Test data sent successfully');
      fetchReadings(); // Refresh data
    } else {
      console.error('❌ Test data failed:', result.error);
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
            <div className="text-sm text-muted-foreground">
              Real-time Air Quality Monitor
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Test Button and Status */}
        <div className="mb-6 text-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-sm text-gray-600">
              Supabase: <span className={connectionStatus === 'SUBSCRIBED' ? 'text-green-600' : 'text-yellow-600'}>
                {connectionStatus === 'SUBSCRIBED' ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              MQTT: <span className={mqttStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>
                {mqttStatus}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Last Update: {latestReading ? new Date(latestReading.timestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={testDataSend} variant="outline" className="gap-2 hover-scale btn-animate hover-glow">
              <TestTube className="h-4 w-4" />
              Send Test Data
            </Button>

          </div>
        </div>

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
