import { supabase } from "@/integrations/supabase/client";

export const getReductionSuggestions = async (co2Level: number, coLevel: number): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('generate-reduction-suggestions', {
    body: { co2_level: co2Level, co_level: coLevel }
  });

  if (error) {
    throw new Error(`Failed to generate suggestions: ${error.message}`);
  }

  return data.suggestions;
};