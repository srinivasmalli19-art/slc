import React, { useState } from 'react';
import { Percent, ArrowRight, RotateCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const FarmerInterestCalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [timeYears, setTimeYears] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    if (!principal || !rate || !timeYears) return;

    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(timeYears);

    const simpleInterest = (p * r * t) / 100;
    const compoundInterest = p * (Math.pow(1 + r / 100, t) - 1);

    setResult({
      principal: p,
      simpleInterest: simpleInterest,
      simpleTotal: p + simpleInterest,
      compoundInterest: compoundInterest,
      compoundTotal: p + compoundInterest,
      monthlyEMI: (p + simpleInterest) / (t * 12),
    });
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
        <p className="text-slate-500 text-sm">Calculate loan interest easily</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Enter Loan Details
          </CardTitle>
          <CardDescription>Enter amount, interest rate, and time period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Loan Amount (₹)</Label>
            <Input
              type="number"
              placeholder="e.g., 100000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interest Rate (% per year)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 7"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time (Years)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g., 3"
                value={timeYears}
                onChange={(e) => setTimeYears(e.target.value)}
              />
            </div>
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
                    ₹{result.simpleInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Total to Pay</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{result.simpleTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg text-center">
                <p className="text-sm text-slate-500">Monthly EMI (approx)</p>
                <p className="text-xl font-bold text-blue-600">
                  ₹{result.monthlyEMI.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
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
                    ₹{result.compoundInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-slate-500">Total to Pay</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{result.compoundTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 text-center">
                <strong>Note:</strong> Compound interest is{' '}
                <span className="text-amber-600 font-semibold">
                  ₹{(result.compoundInterest - result.simpleInterest).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>{' '}
                more than simple interest
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FarmerInterestCalculator;
