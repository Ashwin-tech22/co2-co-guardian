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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-destructive/10">
            <Heart className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Health Impact Analysis</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered assessment of potential health effects
            </p>
          </div>
        </div>

        {!latestReading ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sensor data available yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Current CO₂</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestReading.co2_level.toFixed(1)} ppm
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm text-muted-foreground mb-1">Current CO</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestReading.co_level.toFixed(1)} ppm
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Analyzing health impacts...</p>
              </div>
            ) : analysis ? (
              <div className="prose prose-sm max-w-none">
                <div className="p-5 bg-muted/50 rounded-lg border border-border">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {analysis}
                  </div>
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

      <Card className="p-6 shadow-card bg-warning/5 border-warning/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-2">Important Notice</p>
            <p className="text-muted-foreground">
              This analysis is for informational purposes only. If you experience severe symptoms
              like dizziness, nausea, or difficulty breathing, seek immediate medical attention
              and move to fresh air.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HealthImpact;
