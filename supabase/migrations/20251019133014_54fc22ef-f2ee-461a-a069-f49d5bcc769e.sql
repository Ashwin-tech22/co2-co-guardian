-- Create air quality readings table
CREATE TABLE public.air_quality_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  co2_level DECIMAL(10, 2) NOT NULL,
  co_level DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.air_quality_readings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read the data (public dashboard)
CREATE POLICY "Allow public read access" 
ON public.air_quality_readings 
FOR SELECT 
USING (true);

-- Create policy to allow inserts from API (for ESP32)
CREATE POLICY "Allow API inserts" 
ON public.air_quality_readings 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries on timestamp
CREATE INDEX idx_air_quality_timestamp ON public.air_quality_readings(timestamp DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.air_quality_readings;