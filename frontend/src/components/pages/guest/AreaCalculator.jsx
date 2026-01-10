import React, { useState } from 'react';
import { Calculator, ArrowRight, RotateCcw } from 'lucide-react';
import { utilitiesAPI } from '@/lib/api';
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
import { toast } from 'sonner';

const AreaCalculator = () => {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState('meters');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!length || !width) {
      toast.error('Please enter both length and width');
      return;
    }

    setLoading(true);
    try {
      const response = await utilitiesAPI.calculateArea({
        length: parseFloat(length),
        width: parseFloat(width),
        unit,
      });
      setResult(response.data);
    } catch (error) {
      toast.error('Calculation failed');
    } finally {
      setLoading(false);
    }
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
          Area Calculator
        </h1>
        <p className="text-slate-500 text-sm">Calculate land area for farm planning</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Enter Dimensions
          </CardTitle>
          <CardDescription>Enter the length and width of your land</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                type="number"
                placeholder="Enter length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                data-testid="length-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                placeholder="Enter width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                data-testid="width-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger data-testid="unit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meters">Meters</SelectItem>
                <SelectItem value="feet">Feet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleCalculate} 
              className="flex-1 gap-2"
              disabled={loading}
              data-testid="calculate-btn"
            >
              <ArrowRight className="h-4 w-4" />
              Calculate
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              data-testid="reset-btn"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Square Meters</p>
                <p className="text-2xl font-bold text-primary">
                  {result.area_sq_meters?.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Square Feet</p>
                <p className="text-2xl font-bold text-primary">
                  {result.area_sq_feet?.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Acres</p>
                <p className="text-2xl font-bold text-primary">
                  {result.area_acres?.toFixed(4)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Hectares</p>
                <p className="text-2xl font-bold text-primary">
                  {result.area_hectares?.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AreaCalculator;
