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
  const [todaysFine, setTodaysFine] = useState({ co2: 0, co: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastFineDate, setLastFineDate] = useState<string | null>(null);

  const STANDARDS = {
    CO2_MAX: 10,
    CO_MAX: 1,
    CO2_FINE_RATE: 500,
    CO_FINE_RATE: 1000
  };

  const calculateFine = (co2Level: number, coLevel: number) => {
    let co2Fine = 0;
    let coFine = 0;

    if (co2Level > STANDARDS.CO2_MAX) {
      const excess = co2Level - STANDARDS.CO2_MAX;
      co2Fine = Math.ceil(excess / 1000) * STANDARDS.CO2_FINE_RATE;
    }

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
    if (fine.total === 0) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (lastFineDate !== today) {
      setTodaysFine(fine);
      setLastFineDate(today);
      
      const fineRecord = {
        date: today,
        co2_fine: fine.co2,
        co_fine: fine.co,
        total_fine: fine.total,
        co2_level: reading.co2_level,
        co_level: reading.co_level
      };
      
      const existingFines = JSON.parse(localStorage.getItem('dailyFines') || '[]');
      const updatedFines = existingFines.filter((f: any) => f.date !== today);
      updatedFines.push(fineRecord);
      localStorage.setItem('dailyFines', JSON.stringify(updatedFines));
      
      loadFineRecords();
    }
  };

  const loadFineRecords = async () => {
    const storedFines = JSON.parse(localStorage.getItem('dailyFines') || '[]');
    setFineRecords(storedFines.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = storedFines.find((f: any) => f.date === today);
    
    if (todayRecord) {
      setTodaysFine({
        co2: todayRecord.co2_fine,
        co: todayRecord.co_fine,
        total: todayRecord.total_fine
      });
      setLastFineDate(today);
    } else {
      setTodaysFine({ co2: 0, co: 0, total: 0 });
      setLastFineDate(null);
    }
  };

  const downloadReport = async (monthYear: string) => {
    try {
      const [year, month] = monthYear.split('-');
      const storedFines = JSON.parse(localStorage.getItem('dailyFines') || '[]');
      const monthFines = storedFines.filter((record: any) => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === parseInt(year) && recordDate.getMonth() === parseInt(month) - 1;
      });

      if (monthFines.length === 0) {
        alert('No fine records found for the selected month');
        setIsDialogOpen(false);
        return;
      }

      const csvHeader = 'Date,CO2 Level (ppm),CO Level (ppm),CO2 Fine (INR),CO Fine (INR),Total Fine (INR)\n';
      
      const csvRows = monthFines.map((record: any) => {
        const date = new Date(record.date);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        
        return `${dateStr},${record.co2_level},${record.co_level},${record.co2_fine},${record.co_fine},${record.total_fine}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `emission_report_${monthYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error as Error).message);
    }
  };

  const handleDownload = () => {
    if (selectedMonth) {
      downloadReport(selectedMonth);
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
    
    // Check for new day and reset today's fine
    const checkNewDay = () => {
      const today = new Date().toISOString().split('T')[0];
      if (lastFineDate && lastFineDate !== today) {
        setTodaysFine({ co2: 0, co: 0, total: 0 });
        setLastFineDate(null);
      }
    };
    
    const interval = setInterval(checkNewDay, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastFineDate]);

  useEffect(() => {
    if (latestReading) {
      const fine = calculateFine(latestReading.co2_level, latestReading.co_level);
      
      const today = new Date().toISOString().split('T')[0];
      if (fine.total > 0 && lastFineDate !== today) {
        saveFineRecord(fine, latestReading);
      }
    }
  }, [latestReading, lastFineDate]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Emission Fine Calculator</h2>
          <p className="text-base text-gray-600">
            Based on Government of India vehicle emission standards
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
                    <p className="text-lg font-semibold text-red-700">₹{todaysFine.co2.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CO Fine</p>
                    <p className="text-lg font-semibold text-red-700">₹{todaysFine.co.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-gray-600">Total Today</p>
                  <p className="text-xl font-bold text-red-800">₹{todaysFine.total.toLocaleString()}</p>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Resets daily at midnight
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
                    <td className="py-2 text-gray-800">{new Date(record.date).toLocaleDateString('en-GB')}</td>
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