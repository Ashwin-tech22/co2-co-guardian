import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2, Leaf } from "lucide-react";
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

const ReductionSuggestions = ({ latestReading }: Props) => {
  const [suggestions, setSuggestions] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
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
      const { data, error } = await supabase.functions.invoke('generate-reduction-suggestions', {
        body: { 
          co2_level: latestReading.co2_level,
          co_level: latestReading.co_level 
        }
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latestReading && !suggestions) {
      generateSuggestions();
    }
  }, [latestReading]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-success/10">
            <Leaf className="h-6 w-6 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Pollution Reduction Guide</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations to improve your air quality
            </p>
          </div>
        </div>

        {!latestReading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sensor data available yet</p>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-success" />
                <p className="ml-3 text-muted-foreground">Generating personalized suggestions...</p>
              </div>
            ) : suggestions ? (
              <div className="prose prose-sm max-w-none">
                <div className="p-5 bg-success/5 rounded-lg border border-success/20">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {suggestions}
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={generateSuggestions} className="w-full">
                Get Personalized Recommendations
              </Button>
            )}
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 shadow-card bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Quick Tips - CO₂
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Open windows for cross-ventilation
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Add indoor plants (they absorb CO₂)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Use exhaust fans in enclosed spaces
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Maintain HVAC systems regularly
            </li>
          </ul>
        </Card>

        <Card className="p-5 shadow-card bg-accent/5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            Quick Tips - CO
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Install CO detectors in key areas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Never run vehicles in enclosed garages
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Service heating systems annually
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              Use proper ventilation when cooking
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default ReductionSuggestions;
