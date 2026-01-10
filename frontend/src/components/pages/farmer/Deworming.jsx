import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Loader2, Bug, Calendar } from 'lucide-react';
import { dewormingAPI, animalsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const speciesCategories = [
  { key: 'all', label: 'All' },
  { key: 'cattle_buffalo', label: 'Buffalo/Cattle', species: ['cattle', 'buffalo'] },
  { key: 'sheep_goat', label: 'Sheep/Goat', species: ['sheep', 'goat'] },
  { key: 'poultry', label: 'Poultry', species: ['poultry'] },
  { key: 'others', label: 'Others', species: ['pig', 'dog', 'cat', 'horse', 'donkey', 'camel'] },
];

const commonDewormers = [
  'Albendazole',
  'Fenbendazole',
  'Ivermectin',
  'Levamisole',
  'Oxyclozanide',
  'Praziquantel',
  'Triclabendazole',
  'Moxidectin',
];

const Deworming = () => {
  const navigate = useNavigate();
  const [dewormingRecords, setDewormingRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newDeworming, setNewDeworming] = useState({
    animal_id: '',
    drug_name: '',
    dose: '',
    administered_by: '',
    next_due_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dewormResponse, animalsResponse] = await Promise.all([
        dewormingAPI.getAll(),
        animalsAPI.getAll(),
      ]);
      setDewormingRecords(dewormResponse.data);
      setAnimals(animalsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDeworming.animal_id || !newDeworming.drug_name || !newDeworming.dose) {
      toast.error('Please fill in required fields');
      return;
    }

    setFormLoading(true);
    try {
      await dewormingAPI.create(newDeworming);
      toast.success('Deworming record added!');
      setDialogOpen(false);
      setNewDeworming({
        animal_id: '',
        drug_name: '',
        dose: '',
        administered_by: '',
        next_due_date: '',
        remarks: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add deworming record');
    } finally {
      setFormLoading(false);
    }
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  const filteredRecords = dewormingRecords.filter(record => {
    if (activeCategory === 'all') return true;
    const animal = getAnimalById(record.animal_id);
    if (!animal) return false;
    const category = speciesCategories.find(c => c.key === activeCategory);
    return category?.species?.includes(animal.species);
  });

  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Deworming Records
          </h1>
          <p className="text-slate-500 text-sm">Track deworming schedule for your animals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-deworming-btn">
              <Plus className="h-4 w-4" />
              Add Deworming
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Deworming Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Animal *</Label>
                <Select 
                  value={newDeworming.animal_id}
                  onValueChange={(val) => setNewDeworming({...newDeworming, animal_id: val})}
                >
                  <SelectTrigger data-testid="select-animal-deworming">
                    <SelectValue placeholder="Choose animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map(animal => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag_id} - {animal.breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Drug Name *</Label>
                <Select 
                  value={newDeworming.drug_name}
                  onValueChange={(val) => setNewDeworming({...newDeworming, drug_name: val})}
                >
                  <SelectTrigger data-testid="drug-name-select">
                    <SelectValue placeholder="Select dewormer" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDewormers.map(drug => (
                      <SelectItem key={drug} value={drug}>{drug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dose *</Label>
                  <Input
                    placeholder="e.g., 10ml, 1 tablet"
                    value={newDeworming.dose}
                    onChange={(e) => setNewDeworming({...newDeworming, dose: e.target.value})}
                    data-testid="dose-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Administered By</Label>
                  <Input
                    placeholder="Name"
                    value={newDeworming.administered_by}
                    onChange={(e) => setNewDeworming({...newDeworming, administered_by: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Next Due Date</Label>
                <Input
                  type="date"
                  value={newDeworming.next_due_date}
                  onChange={(e) => setNewDeworming({...newDeworming, next_due_date: e.target.value})}
                  data-testid="next-due-date"
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  placeholder="Any additional notes"
                  value={newDeworming.remarks}
                  onChange={(e) => setNewDeworming({...newDeworming, remarks: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full" disabled={formLoading} data-testid="submit-deworming-btn">
                {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {speciesCategories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key} className="whitespace-nowrap">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card className="p-12 text-center">
              <Bug className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No deworming records found</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                Add your first record
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => {
                const animal = getAnimalById(record.animal_id);
                const dueSoon = isDueSoon(record.next_due_date);
                const overdue = isOverdue(record.next_due_date);
                
                return (
                  <Card 
                    key={record.id} 
                    className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-300 bg-red-50' : dueSoon ? 'border-amber-300 bg-amber-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdue ? 'bg-red-100' : dueSoon ? 'bg-amber-100' : 'bg-orange-100'}`}>
                            <Bug className={`h-5 w-5 ${overdue ? 'text-red-600' : dueSoon ? 'text-amber-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{record.drug_name}</h3>
                            <p className="text-sm text-slate-500">
                              {animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown Animal'}
                            </p>
                            <p className="text-xs text-slate-400">Dose: {record.dose}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatDate(record.date)}</Badge>
                          {record.administered_by && (
                            <p className="text-xs text-slate-500 mt-1">By: {record.administered_by}</p>
                          )}
                        </div>
                      </div>
                      
                      {record.next_due_date && (
                        <div className={`mt-3 flex items-center gap-2 text-sm p-2 rounded ${
                          overdue ? 'text-red-600 bg-red-100' : 
                          dueSoon ? 'text-amber-600 bg-amber-100' : 
                          'text-slate-600 bg-slate-100'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          {overdue ? 'OVERDUE: ' : dueSoon ? 'Due soon: ' : 'Next due: '}
                          {formatDate(record.next_due_date)}
                        </div>
                      )}
                      
                      {record.remarks && (
                        <p className="mt-2 text-sm text-slate-500">{record.remarks}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Deworming;
