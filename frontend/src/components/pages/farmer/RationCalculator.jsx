import React, { useState } from 'react';
import { Calculator, Download, Loader2, Leaf, Milk } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Buffalo physiological status options
const buffaloStatus = [
  { value: 'calf', label: 'Calf (0-6 months)', dmRequired: 2.5, proteinPct: 18, tdnPct: 70 },
  { value: 'growing', label: 'Growing (6-18 months)', dmRequired: 3.0, proteinPct: 14, tdnPct: 65 },
  { value: 'heifer', label: 'Heifer (18-30 months)', dmRequired: 2.8, proteinPct: 12, tdnPct: 60 },
  { value: 'pregnant', label: 'Pregnant (Last 3 months)', dmRequired: 3.2, proteinPct: 14, tdnPct: 65 },
  { value: 'milking_low', label: 'Milking (Up to 5 L/day)', dmRequired: 3.5, proteinPct: 14, tdnPct: 65 },
  { value: 'milking_medium', label: 'Milking (5-10 L/day)', dmRequired: 4.0, proteinPct: 16, tdnPct: 68 },
  { value: 'milking_high', label: 'Milking (Above 10 L/day)', dmRequired: 4.5, proteinPct: 18, tdnPct: 70 },
  { value: 'dry', label: 'Dry', dmRequired: 2.5, proteinPct: 10, tdnPct: 55 },
];

// Available feeds with nutritional values (per kg DM basis)
const availableFeeds = {
  roughages: [
    { id: 'green_fodder', name: 'Green Fodder', dm: 20, cp: 8, tdn: 55, defaultPrice: 3 },
    { id: 'dry_fodder', name: 'Dry Fodder/Straw', dm: 90, cp: 4, tdn: 45, defaultPrice: 5 },
    { id: 'silage', name: 'Silage', dm: 30, cp: 8, tdn: 60, defaultPrice: 4 },
    { id: 'hay', name: 'Hay', dm: 85, cp: 6, tdn: 50, defaultPrice: 8 },
  ],
  concentrates: [
    { id: 'concentrate_mix', name: 'Concentrate Mix/Cattle Feed', dm: 90, cp: 20, tdn: 70, defaultPrice: 25 },
    { id: 'wheat_bran', name: 'Wheat Bran (Chokar)', dm: 88, cp: 15, tdn: 65, defaultPrice: 18 },
    { id: 'rice_bran', name: 'Rice Bran', dm: 90, cp: 13, tdn: 60, defaultPrice: 15 },
    { id: 'mustard_cake', name: 'Mustard Cake (Sarson Khali)', dm: 90, cp: 35, tdn: 75, defaultPrice: 35 },
    { id: 'cotton_seed_cake', name: 'Cotton Seed Cake', dm: 92, cp: 25, tdn: 72, defaultPrice: 30 },
    { id: 'groundnut_cake', name: 'Groundnut Cake', dm: 92, cp: 45, tdn: 78, defaultPrice: 45 },
  ],
  minerals: [
    { id: 'mineral_mix', name: 'Mineral Mixture', dm: 100, cp: 0, tdn: 0, defaultPrice: 80 },
    { id: 'salt', name: 'Common Salt', dm: 100, cp: 0, tdn: 0, defaultPrice: 15 },
  ],
};

const RationCalculator = () => {
  const [activeSpecies, setActiveSpecies] = useState('buffalo');
  const [status, setStatus] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [milkYield, setMilkYield] = useState('');
  const [selectedFeeds, setSelectedFeeds] = useState({});
  const [feedPrices, setFeedPrices] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFeedToggle = (feedId) => {
    setSelectedFeeds(prev => ({
      ...prev,
      [feedId]: !prev[feedId]
    }));
  };

  const handlePriceChange = (feedId, price) => {
    setFeedPrices(prev => ({
      ...prev,
      [feedId]: parseFloat(price) || 0
    }));
  };

  const calculateRation = () => {
    if (!status || !bodyWeight) {
      toast.error('Please select status and enter body weight');
      return;
    }

    setLoading(true);

    // Get status requirements
    const statusData = buffaloStatus.find(s => s.value === status);
    const weight = parseFloat(bodyWeight);
    const milk = parseFloat(milkYield) || 0;

    // Calculate daily requirements based on body weight
    const dmRequired = (weight * statusData.dmRequired) / 100; // kg DM per day
    const cpRequired = (dmRequired * statusData.proteinPct) / 100; // kg CP per day
    const tdnRequired = (dmRequired * statusData.tdnPct) / 100; // kg TDN per day

    // Additional requirements for milk production (0.4 kg DM per liter milk)
    const additionalDM = milk * 0.4;
    const totalDMRequired = dmRequired + additionalDM;

    // Calculate suggested quantities for selected feeds
    const suggestedRation = [];
    let totalCost = 0;
    let providedCP = 0;
    let providedTDN = 0;
    let providedDM = 0;

    // Roughage: 60-70% of DM
    const roughageDM = totalDMRequired * 0.65;
    const concentrateDM = totalDMRequired * 0.35;

    // Check selected roughages
    const selectedRoughages = Object.keys(selectedFeeds)
      .filter(id => selectedFeeds[id])
      .map(id => [...availableFeeds.roughages, ...availableFeeds.concentrates, ...availableFeeds.minerals].find(f => f.id === id))
      .filter(f => f && availableFeeds.roughages.some(r => r.id === f.id));

    const selectedConcentrates = Object.keys(selectedFeeds)
      .filter(id => selectedFeeds[id])
      .map(id => [...availableFeeds.roughages, ...availableFeeds.concentrates, ...availableFeeds.minerals].find(f => f.id === f.id))
      .filter(f => f && availableFeeds.concentrates.some(c => c.id === f.id));

    // Simple allocation logic
    const allFeeds = [...availableFeeds.roughages, ...availableFeeds.concentrates, ...availableFeeds.minerals];
    
    Object.keys(selectedFeeds).forEach(feedId => {
      if (!selectedFeeds[feedId]) return;
      
      const feed = allFeeds.find(f => f.id === feedId);
      if (!feed) return;

      let quantity = 0;
      const isRoughage = availableFeeds.roughages.some(r => r.id === feedId);
      const isConcentrate = availableFeeds.concentrates.some(c => c.id === feedId);
      const isMineral = availableFeeds.minerals.some(m => m.id === feedId);

      if (isRoughage) {
        // Green fodder: 15-20 kg, Dry fodder: 3-5 kg
        if (feedId === 'green_fodder') quantity = Math.min(20, roughageDM * 5);
        else if (feedId === 'dry_fodder') quantity = Math.min(5, roughageDM / 0.9);
        else if (feedId === 'silage') quantity = Math.min(10, roughageDM * 3);
        else quantity = Math.min(5, roughageDM);
      } else if (isConcentrate) {
        // 400g concentrate per liter milk + maintenance
        const concentrateKg = (milk * 0.4) + (weight * 0.01);
        quantity = Math.min(concentrateKg / Object.keys(selectedFeeds).filter(id => 
          selectedFeeds[id] && availableFeeds.concentrates.some(c => c.id === id)
        ).length || 1, 5);
      } else if (isMineral) {
        quantity = feedId === 'mineral_mix' ? 0.05 : 0.03; // 50g mineral, 30g salt
      }

      const price = feedPrices[feedId] || feed.defaultPrice;
      const cost = quantity * price;
      const dmProvided = (quantity * feed.dm) / 100;
      const cpProvided = (dmProvided * feed.cp) / 100;
      const tdnProvided = (dmProvided * feed.tdn) / 100;

      suggestedRation.push({
        feed: feed.name,
        quantity: quantity.toFixed(2),
        price: price,
        cost: cost.toFixed(2),
        dm: dmProvided.toFixed(2),
        cp: cpProvided.toFixed(3),
        tdn: tdnProvided.toFixed(3),
      });

      totalCost += cost;
      providedDM += dmProvided;
      providedCP += cpProvided;
      providedTDN += tdnProvided;
    });

    // Calculate status
    const proteinStatus = providedCP >= cpRequired * 0.9 ? 'adequate' : providedCP >= cpRequired * 0.7 ? 'marginal' : 'deficient';
    const energyStatus = providedTDN >= tdnRequired * 0.9 ? 'adequate' : providedTDN >= tdnRequired * 0.7 ? 'marginal' : 'deficient';
    const costPerLiter = milk > 0 ? totalCost / milk : 0;

    setTimeout(() => {
      setResult({
        requirements: {
          dm: totalDMRequired.toFixed(2),
          cp: cpRequired.toFixed(3),
          tdn: tdnRequired.toFixed(3),
        },
        provided: {
          dm: providedDM.toFixed(2),
          cp: providedCP.toFixed(3),
          tdn: providedTDN.toFixed(3),
        },
        ration: suggestedRation,
        totalCost: totalCost.toFixed(2),
        costPerLiter: costPerLiter.toFixed(2),
        proteinStatus,
        energyStatus,
        milkYield: milk,
      });
      setLoading(false);
    }, 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'adequate': return 'bg-green-100 text-green-800';
      case 'marginal': return 'bg-yellow-100 text-yellow-800';
      case 'deficient': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const generatePDF = () => {
    toast.success('PDF generation feature coming soon!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Ration Calculator
        </h1>
        <p className="text-slate-500 text-sm">Calculate balanced feed for your animals</p>
      </div>

      {/* Species Tabs */}
      <Tabs value={activeSpecies} onValueChange={setActiveSpecies}>
        <TabsList>
          <TabsTrigger value="buffalo">Buffalo</TabsTrigger>
          <TabsTrigger value="cattle" disabled>Cattle (Coming)</TabsTrigger>
          <TabsTrigger value="sheep" disabled>Sheep (Coming)</TabsTrigger>
          <TabsTrigger value="goat" disabled>Goat (Coming)</TabsTrigger>
        </TabsList>

        <TabsContent value="buffalo" className="space-y-6 mt-4">
          {/* Animal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Animal Details
              </CardTitle>
              <CardDescription>Enter your buffalo's details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Physiological Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {buffaloStatus.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Weight (kg) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 450"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                  />
                </div>
                {status?.includes('milking') && (
                  <div className="space-y-2">
                    <Label>Daily Milk Yield (Liters)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 8"
                      value={milkYield}
                      onChange={(e) => setMilkYield(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feed Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Available Feeds</CardTitle>
              <CardDescription>Select feeds you have and enter their price</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Roughages */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Roughages (Green/Dry Fodder)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFeeds.roughages.map(feed => (
                    <div key={feed.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedFeeds[feed.id] || false}
                        onCheckedChange={() => handleFeedToggle(feed.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{feed.name}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="₹/kg"
                          value={feedPrices[feed.id] || ''}
                          onChange={(e) => handlePriceChange(feed.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concentrates */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Concentrates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFeeds.concentrates.map(feed => (
                    <div key={feed.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedFeeds[feed.id] || false}
                        onCheckedChange={() => handleFeedToggle(feed.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{feed.name}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="₹/kg"
                          value={feedPrices[feed.id] || ''}
                          onChange={(e) => handlePriceChange(feed.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minerals */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Minerals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFeeds.minerals.map(feed => (
                    <div key={feed.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedFeeds[feed.id] || false}
                        onCheckedChange={() => handleFeedToggle(feed.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{feed.name}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="₹/kg"
                          value={feedPrices[feed.id] || ''}
                          onChange={(e) => handlePriceChange(feed.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={calculateRation} className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Calculate Ration
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Suggested Daily Ration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  <Badge className={getStatusColor(result.proteinStatus)}>
                    Protein: {result.proteinStatus.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(result.energyStatus)}>
                    Energy: {result.energyStatus.toUpperCase()}
                  </Badge>
                </div>

                {/* Feed Quantities */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Feed Quantities (per day)</h4>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-3">Feed</th>
                          <th className="text-right p-3">Quantity (kg)</th>
                          <th className="text-right p-3">Cost (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.ration.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3">{item.feed}</td>
                            <td className="text-right p-3 font-medium">{item.quantity}</td>
                            <td className="text-right p-3">₹{item.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg text-center">
                    <p className="text-sm text-slate-500">Daily Feed Cost</p>
                    <p className="text-2xl font-bold text-primary">₹{result.totalCost}</p>
                  </div>
                  {result.milkYield > 0 && (
                    <div className="p-4 bg-white rounded-lg text-center">
                      <p className="text-sm text-slate-500">Cost per Liter Milk</p>
                      <p className="text-2xl font-bold text-primary">₹{result.costPerLiter}</p>
                    </div>
                  )}
                  <div className="p-4 bg-white rounded-lg text-center">
                    <p className="text-sm text-slate-500">Monthly Cost (approx)</p>
                    <p className="text-2xl font-bold text-primary">₹{(parseFloat(result.totalCost) * 30).toFixed(0)}</p>
                  </div>
                </div>

                {/* Download Button */}
                <Button variant="outline" onClick={generatePDF} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </Button>

                {/* Disclaimer */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Disclaimer:</strong> This calculation is based on ICAR guidelines and is for reference only. 
                    Actual requirements may vary based on individual animal condition. 
                    Consult a veterinary nutritionist for precise ration formulation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RationCalculator;
