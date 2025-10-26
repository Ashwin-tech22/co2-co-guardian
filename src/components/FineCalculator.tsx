import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, Calendar, Download } from "lucide-react";

interface Reading {
  id: string;
  co2_level: number;
  co_level: number;
  timestamp: string;
}

interface Props {
  latestReading: Reading | null;
}

interface FineRecord {
  date: string;
  co2_fine: number;
  co_fine: number;
  total_fine: number;
  co2_level: number;
  co_level: number;
}

const FineCalculator = ({ latestReading }: Props) => {
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([]);
  const [currentFine, setCurrentFine] = useState({ co2: 0, co: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Government of India standards for vehicle emissions
  const STANDARDS = {
    CO2_MAX: 10,     // ppm
    CO_MAX: 1,       // ppm
    CO2_FINE_RATE: 500, // ₹500 per 1000 ppm excess
    CO_FINE_RATE: 1000  // ₹1000 per 100 ppm excess
  };

  const calculateFine = (co2Level: number, coLevel: number) => {
    let co2Fine = 0;
    let coFine = 0;

    // Calculate CO2 fine
    if (co2Level > STANDARDS.CO2_MAX) {
      const excess = co2Level - STANDARDS.CO2_MAX;
      co2Fine = Math.ceil(excess / 1000) * STANDARDS.CO2_FINE_RATE;
    }

    // Calculate CO fine
    if (coLevel > STANDARDS.CO_MAX) {
      const excess = coLevel - STANDARDS.CO_MAX;
      coFine = Math.ceil(excess / 100) * STANDARDS.CO_FINE_RATE;
    }

    return {
      co2: co2Fine,
      co: coFine,
      total: co2Fine + coFine
    };
  };

  const saveFineRecord = async (fine: any, reading: Reading) => {
    // Just refresh the display records
    if (fine.total > 0) {
      loadFineRecords();
    }
  };

  const loadFineRecords = async () => {
    // Generate mock fine records from recent readings for display
    try {
      const { data: readings, error } = await supabase
        .from('air_quality_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error loading readings:', error);
        return;
      }

      if (readings) {
        const dailyRecords = new Map();
        readings.forEach(reading => {
          const date = new Date(reading.timestamp).toISOString().split('T')[0];
          if (!dailyRecords.has(date)) {
            const fine = calculateFine(reading.co2_level, reading.co_level);
            if (fine.total > 0) {
              dailyRecords.set(date, {
                date,
                co2_fine: fine.co2,
                co_fine: fine.co,
                total_fine: fine.total,
                co2_level: reading.co2_level,
                co_level: reading.co_level
              });
            }
          }
        });
        setFineRecords(Array.from(dailyRecords.values()));
      }
    } catch (error) {
      console.error('Error loading fine records:', error);
    }
  };

  const downloadReport = async (monthYear: string) => {
    console.log('Starting download for month:', monthYear);
    try {
      const [year, month] = monthYear.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

      // Get air quality readings for selected month
      const { data: readings, error: readingsError } = await supabase
        .from('air_quality_readings')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      console.log('Readings fetched:', readings?.length);
      
      if (readingsError) {
        console.error('Error fetching readings:', readingsError);
        alert('Error fetching data: ' + readingsError.message);
        return;
      }

      if (!readings || readings.length === 0) {
        alert('No data found for the selected month');
        setIsDialogOpen(false);
        return;
      }

      // Generate CSV content with daily fines
      const csvHeader = 'Date,Time,CO2 Level (ppm),CO Level (ppm),CO2 Fine (INR),CO Fine (INR),Total Fine (INR)\n';
      
      const dailyFines = new Map();
      const csvRows = readings.map(reading => {
        const date = new Date(reading.timestamp);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        
        const fine = calculateFine(reading.co2_level, reading.co_level);
        
        // Only apply fine once per day
        let dailyFine = { co2: 0, co: 0, total: 0 };
        if (!dailyFines.has(dateStr) && fine.total > 0) {
          dailyFines.set(dateStr, fine);
          dailyFine = fine;
        }
        
        return `${dateStr},${timeStr},${reading.co2_level},${reading.co_level},${dailyFine.co2},${dailyFine.co},${dailyFine.total}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      console.log('CSV content generated, length:', csvContent.length);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `emission_report_${monthYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download initiated');
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error as Error).message);
    }
  };

  const handleDownload = () => {
    console.log('Download button clicked, selected month:', selectedMonth);
    if (selectedMonth) {
      downloadReport(selectedMonth);
    } else {
      console.log('No month selected');
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  useEffect(() => {
    loadFineRecords();
  }, []);

  useEffect(() => {
    if (latestReading) {
      const fine = calculateFine(latestReading.co2_level, latestReading.co_level);
      setCurrentFine(fine);
      saveFineRecord(fine, latestReading);
    }
  }, [latestReading]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Emission Fine Calculator</h2>
              <p className="text-base text-gray-600">
                Based on Government of India vehicle emission standards
              </p>
            </div>

          </div>
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
                <p className="text-sm text-gray-600">
                  Standard: ≤ {STANDARDS.CO2_MAX.toLocaleString()} ppm
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-base text-gray-700 mb-1">Current CO</p>
                <p className="text-xl font-semibold text-gray-800">
                  {latestReading.co_level.toFixed(1)} ppm
                </p>
                <p className="text-sm text-gray-600">
                  Standard: ≤ {STANDARDS.CO_MAX.toLocaleString()} ppm
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Today's Fine</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">CO2 Fine</p>
                    <p className="text-lg font-semibold text-red-700">₹{currentFine.co2.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CO Fine</p>
                    <p className="text-lg font-semibold text-red-700">₹{currentFine.co.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-gray-600">Total Today</p>
                  <p className="text-xl font-bold text-red-800">₹{currentFine.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-5 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800">Total Accumulated Fine</h3>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-800">
                    ₹{fineRecords.reduce((sum, record) => sum + record.total_fine, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">All time total</p>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Daily Fine Records</h3>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Month for Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} disabled={!selectedMonth} className="flex-1">
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {fineRecords.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No fine records yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-700">Date</th>
                  <th className="text-right py-2 text-gray-700">CO2 (ppm)</th>
                  <th className="text-right py-2 text-gray-700">CO (ppm)</th>
                  <th className="text-right py-2 text-gray-700">Total Fine</th>
                </tr>
              </thead>
              <tbody>
                {fineRecords.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-800">{record.date}</td>
                    <td className="text-right py-2 text-gray-700">{record.co2_level.toFixed(1)}</td>
                    <td className="text-right py-2 text-gray-700">{record.co_level.toFixed(1)}</td>
                    <td className="text-right py-2 font-semibold text-red-700">
                      ₹{record.total_fine.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FineCalculator;