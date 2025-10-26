import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getReductionSuggestions } from "@/services/geminiService";

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
      const reductionSuggestions = await getReductionSuggestions(latestReading.co2_level, latestReading.co_level);
      setSuggestions(reductionSuggestions);
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
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-800 leading-relaxed text-base space-y-4">
                  {suggestions.split('\n').map((paragraph, index) => {
                    if (!paragraph.trim()) return null;
                    
                    // Clean up the text by removing markdown symbols and extra spaces
                    const cleanText = paragraph
                      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove ** bold markers
                      .replace(/\*([^*]+)\*/g, '$1') // Remove * italic markers
                      .replace(/---+/g, '') // Remove horizontal lines
                      .replace(/#{1,6}\s*/g, '') // Remove # headers
                      .replace(/&quot;/g, '"') // Replace HTML entities
                      .replace(/&amp;/g, '&') // Replace HTML entities
                      .replace(/&lt;/g, '<') // Replace HTML entities
                      .replace(/&gt;/g, '>') // Replace HTML entities
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
