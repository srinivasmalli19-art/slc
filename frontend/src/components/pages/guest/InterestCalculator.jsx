import React, { useState } from 'react';
import { Percent, ArrowRight, RotateCcw, TrendingUp } from 'lucide-react';
import { utilitiesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const InterestCalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [timeYears, setTimeYears] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!principal || !rate || !timeYears) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await utilitiesAPI.calculateInterest({
        principal: parseFloat(principal),
        rate: parseFloat(rate),
        time_years: parseFloat(timeYears),
      });
      setResult(response.data);
    } catch (error) {
      toast.error('Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrincipal('');
    setRate('');
    setTimeYears('');
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Interest Calculator
        </h1>
        <p className="text-slate-500 text-sm">Calculate loan interest for financial planning</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Enter Loan Details
          </CardTitle>
          <CardDescription>Enter principal amount, interest rate, and duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Principal Amount (₹)</Label>
            <Input
              id="principal"
              type="number"
              placeholder="e.g., 100000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              data-testid="principal-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Interest Rate (% per year)</Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                placeholder="e.g., 7.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                data-testid="rate-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time Period (Years)</Label>
              <Input
                id="time"
                type="number"
                step="0.5"
                placeholder="e.g., 3"
                value={timeYears}
                onChange={(e) => setTimeYears(e.target.value)}
                data-testid="time-input"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleCalculate} 
              className="flex-1 gap-2"
              disabled={loading}
              data-testid="calculate-interest-btn"
            >
              <ArrowRight className="h-4 w-4" />
              Calculate
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              data-testid="reset-interest-btn"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Simple Interest */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-800 text-lg">Simple Interest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Interest Amount</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{result.simple_interest?.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{result.simple_total?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compound Interest */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-800 text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compound Interest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Interest Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{result.compound_interest?.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{result.compound_total?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 text-center">
                <strong>Difference:</strong> You would pay{' '}
                <span className="text-amber-600 font-semibold">
                  ₹{(result.compound_interest - result.simple_interest).toLocaleString()}
                </span>{' '}
                more with compound interest
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InterestCalculator;
