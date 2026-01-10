import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Milk, Calendar, TrendingUp } from 'lucide-react';
import { animalsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const MilkRecords = () => {
  const [animals, setAnimals] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newRecord, setNewRecord] = useState({
    animal_id: '',
    morning_yield: '',
    evening_yield: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const animalsResponse = await animalsAPI.getAll();
      // Filter only milking animals (female cattle/buffalo)
      const milkingAnimals = animalsResponse.data.filter(
        a => a.gender === 'female' && ['cattle', 'buffalo', 'goat', 'sheep'].includes(a.species)
      );
      setAnimals(milkingAnimals);
      
      // Load mock milk records from localStorage
      const stored = localStorage.getItem('slc_milk_records');
      if (stored) {
        setMilkRecords(JSON.parse(stored));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRecord.animal_id || !newRecord.morning_yield) {
      toast.error('Please fill in required fields');
      return;
    }

    const record = {
      id: Date.now().toString(),
      ...newRecord,
      morning_yield: parseFloat(newRecord.morning_yield),
      evening_yield: newRecord.evening_yield ? parseFloat(newRecord.evening_yield) : 0,
      total_yield: parseFloat(newRecord.morning_yield) + (newRecord.evening_yield ? parseFloat(newRecord.evening_yield) : 0),
      created_at: new Date().toISOString(),
    };

    const updatedRecords = [record, ...milkRecords];
    setMilkRecords(updatedRecords);
    localStorage.setItem('slc_milk_records', JSON.stringify(updatedRecords));
    
    toast.success('Milk record added!');
    setDialogOpen(false);
    setNewRecord({
      animal_id: '',
      morning_yield: '',
      evening_yield: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  const getTodayTotal = () => {
    const today = new Date().toISOString().split('T')[0];
    return milkRecords
      .filter(r => r.date === today)
      .reduce((sum, r) => sum + r.total_yield, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Milk Records
          </h1>
          <p className="text-slate-500 text-sm">Track daily milk yield from your animals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-milk-record-btn">
              <Plus className="h-4 w-4" />
              Add Milk Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milk Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Animal *</Label>
                <Select 
                  value={newRecord.animal_id}
                  onValueChange={(val) => setNewRecord({...newRecord, animal_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose milking animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.length === 0 ? (
                      <SelectItem value="none" disabled>No milking animals found</SelectItem>
                    ) : (
                      animals.map(animal => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.tag_id} - {animal.breed}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Morning Yield (Litres) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    value={newRecord.morning_yield}
                    onChange={(e) => setNewRecord({...newRecord, morning_yield: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evening Yield (Litres)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 4.5"
                    value={newRecord.evening_yield}
                    onChange={(e) => setNewRecord({...newRecord, evening_yield: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <Card className="bg-sky-50 border-sky-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                <Milk className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-sky-600">Today's Total</p>
                <p className="text-2xl font-bold text-sky-800">{getTodayTotal().toFixed(1)} Litres</p>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-sky-300" />
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : milkRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Milk className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No milk records found</p>
          <p className="text-sm text-slate-400 mt-1">Start tracking your daily milk yield</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Add your first record
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {milkRecords.map((record) => {
            const animal = getAnimalById(record.animal_id);
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                        <Milk className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown Animal'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Morning: {record.morning_yield}L | Evening: {record.evening_yield}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-sky-100 text-sky-800">{record.total_yield.toFixed(1)} L</Badge>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(record.date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MilkRecords;
