-- Create fine records table
CREATE TABLE public.fine_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  co2_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
  co_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
  co2_level DECIMAL(10, 2) NOT NULL,
  co_level DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable Row Level Security
ALTER TABLE public.fine_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" 
ON public.fine_records 
FOR SELECT 
USING (true);

-- Create policy to allow inserts
CREATE POLICY "Allow public inserts" 
ON public.fine_records 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow updates
CREATE POLICY "Allow public updates" 
ON public.fine_records 
FOR UPDATE 
USING (true);

-- Create index for faster queries on date
CREATE INDEX idx_fine_records_date ON public.fine_records(date DESC);