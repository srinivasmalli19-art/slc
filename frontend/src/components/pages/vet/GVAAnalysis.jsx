import React, { useState, useEffect } from 'react';
import { 
  Calculator, Loader2, Download, FileText, TrendingUp,
  Milk, Beef, Egg, ChevronRight, Info, BarChart3, PiggyBank
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
};

const GVAAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  
  // Input state
  const [inputs, setInputs] = useState({
    // Livestock Census
    cattle_count: 0,
    buffalo_count: 0,
    sheep_count: 0,
    goat_count: 0,
    poultry_count: 0,
    // Milk Parameters
    avg_milk_yield_per_day: 0,
    milk_price_per_litre: 0,
    // Meat Parameters
    avg_live_weight_kg: 0,
    meat_price_per_kg: 0,
    // Poultry & Egg
    eggs_per_bird_per_year: 0,
    egg_price: 0,
    poultry_meat_price_per_kg: 0,
    // Location
    village_name: '',
    mandal: '',
    district: '',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/gva/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: field.includes('name') || field.includes('mandal') || field.includes('district') 
        ? value 
        : parseFloat(value) || 0
    }));
  };

  const handleCalculate = async () => {
    // Validate minimum inputs
    if (inputs.cattle_count === 0 && inputs.buffalo_count === 0 && 
        inputs.sheep_count === 0 && inputs.goat_count === 0 && 
        inputs.poultry_count === 0) {
      toast.error('Please enter at least one livestock count');
      return;
    }

    setCalculating(true);
    try {
      const response = await api.post('/gva/calculate', inputs);
      setCurrentReport(response.data);
      setActiveTab('results');
      toast.success('GVA calculated successfully!');
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleDownloadPdf = async (reportId) => {
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/gva/reports/${reportId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GVA_Report_${reportId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const viewReport = (report) => {
    setCurrentReport(report);
    setActiveTab('results');
  };

  const results = currentReport?.results || {};
  const reportInputs = currentReport?.inputs || inputs;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            GVA & Economic Analysis
          </h1>
          <p className="text-slate-500 text-sm">Village-level Gross Value Added calculation</p>
        </div>
        <Badge className="bg-green-100 text-green-700 gap-1">
          <BarChart3 className="h-3 w-3" />
          Production Ready
        </Badge>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Economic Planning Tool</p>
              <p className="text-sm text-blue-700">
                Calculate GVA for Milk, Meat (Sheep/Goat, Buffalo, Poultry), and Eggs. 
                All percentages are system-configured and cannot be modified by users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="results" disabled={!currentReport}>Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* INPUT TAB */}
        <TabsContent value="input" className="space-y-6 mt-6">
          {/* Livestock Census */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Beef className="h-5 w-5 text-amber-600" />
                Livestock Census
              </CardTitle>
              <CardDescription>Enter the number of animals in the village</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Cattle</Label>
                  <Input
                    type="number"
                    value={inputs.cattle_count}
                    onChange={(e) => handleInputChange('cattle_count', e.target.value)}
                    placeholder="0"
                    data-testid="cattle-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buffalo</Label>
                  <Input
                    type="number"
                    value={inputs.buffalo_count}
                    onChange={(e) => handleInputChange('buffalo_count', e.target.value)}
                    placeholder="0"
                    data-testid="buffalo-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sheep</Label>
                  <Input
                    type="number"
                    value={inputs.sheep_count}
                    onChange={(e) => handleInputChange('sheep_count', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goat</Label>
                  <Input
                    type="number"
                    value={inputs.goat_count}
                    onChange={(e) => handleInputChange('goat_count', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Poultry</Label>
                  <Input
                    type="number"
                    value={inputs.poultry_count}
                    onChange={(e) => handleInputChange('poultry_count', e.target.value)}
                    placeholder="0"
                    data-testid="poultry-count"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milk Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Milk className="h-5 w-5 text-blue-600" />
                Milk Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Average Milk Yield (litres/animal/day)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.avg_milk_yield_per_day}
                    onChange={(e) => handleInputChange('avg_milk_yield_per_day', e.target.value)}
                    placeholder="e.g., 8"
                    data-testid="milk-yield"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Milk Price (₹/litre)</Label>
                  <Input
                    type="number"
                    value={inputs.milk_price_per_litre}
                    onChange={(e) => handleInputChange('milk_price_per_litre', e.target.value)}
                    placeholder="e.g., 45"
                    data-testid="milk-price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meat Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Beef className="h-5 w-5 text-red-600" />
                Meat Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Average Live Weight at Slaughter (kg)</Label>
                  <Input
                    type="number"
                    value={inputs.avg_live_weight_kg}
                    onChange={(e) => handleInputChange('avg_live_weight_kg', e.target.value)}
                    placeholder="e.g., 35"
                    data-testid="live-weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meat Price (₹/kg)</Label>
                  <Input
                    type="number"
                    value={inputs.meat_price_per_kg}
                    onChange={(e) => handleInputChange('meat_price_per_kg', e.target.value)}
                    placeholder="e.g., 400"
                    data-testid="meat-price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poultry & Egg Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Egg className="h-5 w-5 text-yellow-600" />
                Poultry & Egg Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Eggs per Bird per Year</Label>
                  <Input
                    type="number"
                    value={inputs.eggs_per_bird_per_year}
                    onChange={(e) => handleInputChange('eggs_per_bird_per_year', e.target.value)}
                    placeholder="e.g., 280"
                    data-testid="eggs-per-bird"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Egg Price (₹/egg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.egg_price}
                    onChange={(e) => handleInputChange('egg_price', e.target.value)}
                    placeholder="e.g., 6"
                    data-testid="egg-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Poultry Meat Price (₹/kg)</Label>
                  <Input
                    type="number"
                    value={inputs.poultry_meat_price_per_kg}
                    onChange={(e) => handleInputChange('poultry_meat_price_per_kg', e.target.value)}
                    placeholder="e.g., 180"
                    data-testid="poultry-meat-price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Village Name</Label>
                  <Input
                    value={inputs.village_name}
                    onChange={(e) => handleInputChange('village_name', e.target.value)}
                    placeholder="Enter village name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mandal / Taluk</Label>
                  <Input
                    value={inputs.mandal}
                    onChange={(e) => handleInputChange('mandal', e.target.value)}
                    placeholder="Enter mandal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input
                    value={inputs.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="Enter district"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate} 
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
            disabled={calculating}
            size="lg"
            data-testid="calculate-gva-btn"
          >
            {calculating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Calculator className="h-5 w-5" />
            )}
            Calculate GVA
          </Button>
        </TabsContent>

        {/* RESULTS TAB */}
        <TabsContent value="results" className="space-y-6 mt-6">
          {currentReport && (
            <>
              {/* Summary Card */}
              <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Village GVA</p>
                      <p className="text-4xl font-bold mt-1">
                        {formatCurrency(results.total_village_gva)}
                      </p>
                      <p className="text-green-200 text-sm mt-2">
                        {reportInputs.village_name || 'Village'} | {formatDate(currentReport.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <PiggyBank className="h-16 w-16 text-green-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GVA Breakdown */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Milk GVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Milk className="h-4 w-4 text-blue-600" />
                      Milk GVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(results.milk_gva)}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Breedable Animals:</span>
                        <span className="font-medium">{results.milk_breedable_animals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In-Milk Animals:</span>
                        <span className="font-medium">{results.milk_in_milk_animals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Production:</span>
                        <span className="font-medium">{results.milk_annual_production?.toLocaleString()} L</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>GSDP:</span>
                        <span>{formatCurrency(results.milk_gsdp)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Input Cost (40%):</span>
                        <span>-{formatCurrency(results.milk_input_cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sheep & Goat Meat GVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Beef className="h-4 w-4 text-amber-600" />
                      Sheep & Goat Meat GVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-700">
                      {formatCurrency(results.sheep_goat_gva)}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Slaughter Count (45%):</span>
                        <span className="font-medium">{results.sheep_goat_slaughter_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Meat (3 seasons):</span>
                        <span className="font-medium">{results.sheep_goat_annual_meat?.toLocaleString()} kg</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>GSDP:</span>
                        <span>{formatCurrency(results.sheep_goat_gsdp)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Input Cost (20%):</span>
                        <span>-{formatCurrency(results.sheep_goat_input_cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Buffalo Meat GVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Beef className="h-4 w-4 text-purple-600" />
                      Buffalo Meat GVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatCurrency(results.buffalo_meat_gva)}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Slaughter Count (25%):</span>
                        <span className="font-medium">{results.buffalo_slaughter_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Meat Production:</span>
                        <span className="font-medium">{results.buffalo_meat_production?.toLocaleString()} kg</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>GSDP:</span>
                        <span>{formatCurrency(results.buffalo_gsdp)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Input Cost (15%):</span>
                        <span>-{formatCurrency(results.buffalo_input_cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Poultry Meat GVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Beef className="h-4 w-4 text-red-600" />
                      Poultry Meat GVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(results.poultry_meat_gva)}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Annual Birds (8 batches):</span>
                        <span className="font-medium">{results.poultry_annual_birds?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slaughter (95%):</span>
                        <span className="font-medium">{results.poultry_slaughter_count?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dressed Meat (70%):</span>
                        <span className="font-medium">{results.poultry_dressed_meat?.toLocaleString()} kg</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>GSDP:</span>
                        <span>{formatCurrency(results.poultry_gsdp)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Input Cost (45%):</span>
                        <span>-{formatCurrency(results.poultry_input_cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Egg GVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Egg className="h-4 w-4 text-yellow-600" />
                      Egg GVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-700">
                      {formatCurrency(results.egg_gva)}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Annual Production:</span>
                        <span className="font-medium">{results.egg_annual_production?.toLocaleString()} eggs</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>GSDP:</span>
                        <span>{formatCurrency(results.egg_gsdp)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Input Cost (40%):</span>
                        <span>-{formatCurrency(results.egg_input_cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Download PDF Button */}
              <Button 
                onClick={() => handleDownloadPdf(currentReport.id)}
                className="w-full gap-2"
                variant="outline"
                size="lg"
                disabled={downloadingPdf}
                data-testid="download-pdf-btn"
              >
                {downloadingPdf ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Download PDF Report
              </Button>

              {/* Disclaimer */}
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-600 text-center">
                    <strong>Disclaimer:</strong> These calculations are planning estimates only. 
                    Final economic decisions depend on local conditions. 
                    Calculation parameters are system-configured and cannot be modified by veterinarians.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4 mt-6">
          {reports.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No GVA reports generated yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('input')}
              >
                Create First Report
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {report.inputs?.village_name || 'Village GVA Report'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {report.inputs?.district && `${report.inputs.district} • `}
                            {formatDate(report.created_at)}
                          </p>
                          <p className="text-xs text-slate-400">
                            By: {report.vet_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(report.results?.total_village_gva)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => viewReport(report)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadPdf(report.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GVAAnalysis;
