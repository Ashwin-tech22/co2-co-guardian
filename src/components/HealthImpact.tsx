import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

interface Props {
  latestReading: Reading | null;
}

const HealthImpact = ({ latestReading }: Props) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeHealthImpact = async () => {
    if (!latestReading) {
      toast({
        title: "No data available",
        description: "Waiting for sensor readings...",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-health-impact', {
        body: { 
          co2_level: latestReading.co2_level,
          co_level: latestReading.co_level 
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing health impact:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze health impact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latestReading && !analysis) {
      analyzeHealthImpact();
    }
  }, [latestReading]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 shadow-card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Health Impact Analysis</h2>
          <p className="text-base text-gray-600">
            Assessment of potential health effects
          </p>
        </div>

        {!latestReading ? (
          <div className="text-center py-8">
            <p className="text-base text-gray-600">No sensor data available yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-base text-gray-700 mb-1">Current CO2</p>
                <p className="text-xl font-semibold text-gray-800">
                  {latestReading.co2_level.toFixed(1)} ppm
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-base text-gray-700 mb-1">Current CO</p>
                <p className="text-xl font-semibold text-gray-800">
                  {latestReading.co_level.toFixed(1)} ppm
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-base text-gray-600">Analyzing health impacts...</p>
              </div>
            ) : analysis ? (
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-800 leading-relaxed text-base space-y-4">
                  {analysis.split('\n').map((paragraph, index) => {
                    if (!paragraph.trim()) return null;
                    
                    // Clean up the text by removing markdown symbols and extra spaces
                    const cleanText = paragraph
                      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove ** bold markers
                      .replace(/\*([^*]+)\*/g, '$1') // Remove * italic markers
                      .replace(/---+/g, '') // Remove horizontal lines
                      .replace(/#{1,6}\s*/g, '') // Remove # headers
                      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                      .trim();
                    
                    if (!cleanText) return null;
                    
                    // Style different types of content
                    if (cleanText.includes(':') && cleanText.length < 100) {
                      return (
                        <h3 key={index} className="font-semibold text-gray-900 text-lg">
                          {cleanText}
                        </h3>
                      );
                    }
                    
                    return (
                      <p key={index} className="text-gray-700">
                        {cleanText}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Button onClick={analyzeHealthImpact} className="w-full">
                Generate Health Impact Report
              </Button>
            )}
          </>
        )}
      </Card>

      <Card className="p-6 shadow-card bg-yellow-50 border-yellow-200">
        <div className="text-base text-gray-800">
          <p className="font-semibold mb-2">Important Notice</p>
          <p className="text-gray-700">
            This analysis is for informational purposes only. If you experience severe symptoms
            like dizziness, nausea, or difficulty breathing, seek immediate medical attention
            and move to fresh air.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default HealthImpact;
