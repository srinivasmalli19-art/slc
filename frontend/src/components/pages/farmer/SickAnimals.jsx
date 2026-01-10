import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle, ThermometerSun, Stethoscope } from 'lucide-react';
import { animalsAPI } from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const commonSymptoms = [
  'Not eating',
  'Fever',
  'Diarrhea',
  'Coughing',
  'Lameness',
  'Skin problem',
  'Eye discharge',
  'Nasal discharge',
  'Swelling',
  'Reduced milk',
  'Weakness',
  'Bloating'
];

const SickAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [sickRecords, setSickRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [newRecord, setNewRecord] = useState({
    animal_id: '',
    observed_date: new Date().toISOString().split('T')[0],
    description: '',
    severity: 'mild',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const animalsResponse = await animalsAPI.getAll();
      setAnimals(animalsResponse.data);
      
      // Load sick records from localStorage
      const stored = localStorage.getItem('slc_sick_records');
      if (stored) {
        setSickRecords(JSON.parse(stored));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRecord.animal_id || selectedSymptoms.length === 0) {
      toast.error('Please select animal and at least one symptom');
      return;
    }

    const record = {
      id: Date.now().toString(),
      ...newRecord,
      symptoms: selectedSymptoms,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const updatedRecords = [record, ...sickRecords];
    setSickRecords(updatedRecords);
    localStorage.setItem('slc_sick_records', JSON.stringify(updatedRecords));
    
    toast.success('Sick animal record added! Please consult a veterinarian.');
    setDialogOpen(false);
    setNewRecord({
      animal_id: '',
      observed_date: new Date().toISOString().split('T')[0],
      description: '',
      severity: 'mild',
    });
    setSelectedSymptoms([]);
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const activeCount = sickRecords.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Sick Animals
          </h1>
          <p className="text-slate-500 text-sm">Report and track sick animals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="report-sick-btn">
              <Plus className="h-4 w-4" />
              Report Sick Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Sick Animal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Animal *</Label>
                <Select 
                  value={newRecord.animal_id}
                  onValueChange={(val) => setNewRecord({...newRecord, animal_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map(animal => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag_id} - {animal.breed} ({speciesDisplayNames[animal.species]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>When did you notice? *</Label>
                <Input
                  type="date"
                  value={newRecord.observed_date}
                  onChange={(e) => setNewRecord({...newRecord, observed_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Symptoms *</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                  {commonSymptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={() => toggleSymptom(symptom)}
                      />
                      <label htmlFor={symptom} className="text-sm cursor-pointer">
                        {symptom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>How serious does it look?</Label>
                <Select 
                  value={newRecord.severity}
                  onValueChange={(val) => setNewRecord({...newRecord, severity: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild - Animal is still active</SelectItem>
                    <SelectItem value="moderate">Moderate - Animal is weak</SelectItem>
                    <SelectItem value="severe">Severe - Animal cannot stand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Other details (optional)</Label>
                <Textarea
                  placeholder="Describe what you observed..."
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> This record is for your reference only. 
                  Please contact a veterinarian for proper diagnosis and treatment.
                </p>
              </div>

              <Button type="submit" className="w-full">
                Submit Report
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Banner */}
      {activeCount > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">{activeCount} animal(s) need attention</p>
                <p className="text-sm text-red-600">Please consult a veterinarian for proper treatment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sickRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No sick animal reports</p>
          <p className="text-sm text-slate-400 mt-1">All your animals appear healthy!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sickRecords.map((record) => {
            const animal = getAnimalById(record.animal_id);
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <ThermometerSun className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown Animal'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Observed: {formatDate(record.observed_date)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(record.severity)}>
                      {record.severity}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {record.symptoms.map((symptom, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                  
                  {record.description && (
                    <p className="mt-2 text-sm text-slate-600">{record.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SickAnimals;
