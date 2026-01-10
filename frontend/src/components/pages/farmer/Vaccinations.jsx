import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Loader2, Syringe, Calendar } from 'lucide-react';
import { vaccinationsAPI, animalsAPI } from '@/lib/api';
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

const Vaccinations = () => {
  const navigate = useNavigate();
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newVaccination, setNewVaccination] = useState({
    animal_id: '',
    vaccine_name: '',
    batch_number: '',
    dose: '',
    next_due_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vaccResponse, animalsResponse] = await Promise.all([
        vaccinationsAPI.getAll(),
        animalsAPI.getAll(),
      ]);
      setVaccinations(vaccResponse.data);
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
    if (!newVaccination.animal_id || !newVaccination.vaccine_name) {
      toast.error('Please fill in required fields');
      return;
    }

    setFormLoading(true);
    try {
      await vaccinationsAPI.create(newVaccination);
      toast.success('Vaccination record added!');
      setDialogOpen(false);
      setNewVaccination({
        animal_id: '',
        vaccine_name: '',
        batch_number: '',
        dose: '',
        next_due_date: '',
        remarks: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add vaccination');
    } finally {
      setFormLoading(false);
    }
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  const filteredVaccinations = vaccinations.filter(vacc => {
    if (activeCategory === 'all') return true;
    const animal = getAnimalById(vacc.animal_id);
    if (!animal) return false;
    const category = speciesCategories.find(c => c.key === activeCategory);
    return category?.species?.includes(animal.species);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Vaccinations
          </h1>
          <p className="text-slate-500 text-sm">Track vaccination records for your animals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-vaccination-btn">
              <Plus className="h-4 w-4" />
              Add Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vaccination Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Animal *</Label>
                <Select 
                  value={newVaccination.animal_id}
                  onValueChange={(val) => setNewVaccination({...newVaccination, animal_id: val})}
                >
                  <SelectTrigger data-testid="select-animal">
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
                <Label>Vaccine Name *</Label>
                <Input
                  placeholder="Enter vaccine name"
                  value={newVaccination.vaccine_name}
                  onChange={(e) => setNewVaccination({...newVaccination, vaccine_name: e.target.value})}
                  data-testid="vaccine-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    placeholder="Batch #"
                    value={newVaccination.batch_number}
                    onChange={(e) => setNewVaccination({...newVaccination, batch_number: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dose</Label>
                  <Input
                    placeholder="e.g., 2ml"
                    value={newVaccination.dose}
                    onChange={(e) => setNewVaccination({...newVaccination, dose: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Next Due Date</Label>
                <Input
                  type="date"
                  value={newVaccination.next_due_date}
                  onChange={(e) => setNewVaccination({...newVaccination, next_due_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  placeholder="Any additional notes"
                  value={newVaccination.remarks}
                  onChange={(e) => setNewVaccination({...newVaccination, remarks: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full" disabled={formLoading} data-testid="submit-vaccination-btn">
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
          ) : filteredVaccinations.length === 0 ? (
            <Card className="p-12 text-center">
              <Syringe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No vaccination records found</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                Add your first record
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredVaccinations.map((vacc) => {
                const animal = getAnimalById(vacc.animal_id);
                return (
                  <Card key={vacc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Syringe className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{vacc.vaccine_name}</h3>
                            <p className="text-sm text-slate-500">
                              {animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown Animal'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{formatDate(vacc.date)}</Badge>
                      </div>
                      
                      {vacc.next_due_date && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          <Calendar className="h-4 w-4" />
                          Next due: {formatDate(vacc.next_due_date)}
                        </div>
                      )}
                      
                      {vacc.remarks && (
                        <p className="mt-2 text-sm text-slate-500">{vacc.remarks}</p>
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

export default Vaccinations;
