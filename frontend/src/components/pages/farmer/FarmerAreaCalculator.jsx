import React from 'react';
import { Calculator, ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FarmerAreaCalculator = () => {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState('feet');
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    if (!length || !width) return;

    const l = parseFloat(length);
    const w = parseFloat(width);
    let areaSqFeet = l * w;
    
    if (unit === 'meters') {
      areaSqFeet = areaSqFeet * 10.764;
    }

    const results = {
      sqFeet: areaSqFeet,
      sqMeters: areaSqFeet * 0.0929,
      acres: areaSqFeet / 43560,
      hectares: (areaSqFeet * 0.0929) / 10000,
      guntha: areaSqFeet / 1089,
      bigha: areaSqFeet / 27000,
    };

    setResult(results);
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Area Measurement
        </h1>
        <p className="text-slate-500 text-sm">Calculate your land area easily</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Enter Land Size
          </CardTitle>
          <CardDescription>Enter length and width of your land</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Length</Label>
              <Input
                type="number"
                placeholder="Enter length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                placeholder="Enter width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feet">Feet</SelectItem>
                <SelectItem value="meters">Meters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleCalculate} className="flex-1 gap-2">
              <ArrowRight className="h-4 w-4" />
              Calculate
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Square Feet</p>
                <p className="text-xl font-bold text-primary">{result.sqFeet.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Square Meters</p>
                <p className="text-xl font-bold text-primary">{result.sqMeters.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Acres</p>
                <p className="text-xl font-bold text-primary">{result.acres.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Hectares</p>
                <p className="text-xl font-bold text-primary">{result.hectares.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Guntha</p>
                <p className="text-xl font-bold text-primary">{result.guntha.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Bigha</p>
                <p className="text-xl font-bold text-primary">{result.bigha.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FarmerAreaCalculator;
