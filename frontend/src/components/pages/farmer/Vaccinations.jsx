import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Syringe, Calendar } from 'lucide-react';
import { vaccinationsAPI, animalsAPI } from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Species-specific vaccine lists
const vaccinesBySpecies = {
  cattle: [
    'FMD (Foot and Mouth Disease)',
    'HS (Haemorrhagic Septicaemia)',
    'BQ (Black Quarter)',
    'Brucellosis',
    'Anthrax',
    'Theileriosis',
    'IBR (Infectious Bovine Rhinotracheitis)',
    'Rabies',
    'Other'
  ],
  buffalo: [
    'FMD (Foot and Mouth Disease)',
    'HS (Haemorrhagic Septicaemia)',
    'BQ (Black Quarter)',
    'Brucellosis',
    'Anthrax',
    'Rabies',
    'Other'
  ],
  sheep: [
    'PPR (Peste des Petits Ruminants)',
    'Enterotoxaemia',
    'Sheep Pox',
    'FMD (Foot and Mouth Disease)',
    'HS (Haemorrhagic Septicaemia)',
    'Brucellosis',
    'Anthrax',
    'Rabies',
    'Other'
  ],
  goat: [
    'PPR (Peste des Petits Ruminants)',
    'Enterotoxaemia',
    'Goat Pox',
    'FMD (Foot and Mouth Disease)',
    'HS (Haemorrhagic Septicaemia)',
    'Brucellosis',
    'Anthrax',
    'Rabies',
    'CCPP',
    'Other'
  ],
  pig: [
    'Classical Swine Fever (CSF)',
    'FMD (Foot and Mouth Disease)',
    'Swine Erysipelas',
    'Porcine Parvovirus',
    'Rabies',
    'Other'
  ],
  poultry: [
    'Marek\'s Disease',
    'Newcastle Disease (Ranikhet)',
    'Infectious Bursal Disease (Gumboro)',
    'Fowl Pox',
    'Infectious Bronchitis',
    'Avian Influenza',
    'Fowl Cholera',
    'Other'
  ],
  dog: [
    'Rabies',
    'Distemper',
    'Parvovirus',
    'Hepatitis',
    'Leptospirosis',
    'Kennel Cough',
    'DHPP (Combination)',
    'Other'
  ],
  cat: [
    'Rabies',
    'Feline Panleukopenia',
    'Feline Calicivirus',
    'Feline Rhinotracheitis',
    'FVRCP (Combination)',
    'Other'
  ],
  horse: [
    'Tetanus',
    'Equine Influenza',
    'Strangles',
    'Rabies',
    'EHV (Equine Herpesvirus)',
    'Other'
  ],
  donkey: [
    'Tetanus',
    'Rabies',
    'Equine Influenza',
    'Other'
  ],
  camel: [
    'Anthrax',
    'Rabies',
    'Camel Pox',
    'Other'
  ],
};

const routeOptions = [
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'sc', label: 'Subcutaneous (SC)' },
  { value: 'id', label: 'Intradermal (ID)' },
  { value: 'oral', label: 'Oral' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'eye', label: 'Eye Drop' },
];

const speciesCategories = [
  { key: 'all', label: 'All' },
  { key: 'cattle_buffalo', label: 'Buffalo/Cattle', species: ['cattle', 'buffalo'] },
  { key: 'sheep_goat', label: 'Sheep/Goat', species: ['sheep', 'goat'] },
  { key: 'poultry', label: 'Poultry', species: ['poultry'] },
  { key: 'others', label: 'Others', species: ['pig', 'dog', 'cat', 'horse', 'donkey', 'camel'] },
];

const VaccinationsEnhanced = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  const [newVaccination, setNewVaccination] = useState({
    animal_id: '',
    vaccine_name: '',
    batch_number: '',
    dose: '',
    route: '',
    administered_by: '',
    vaccination_date: new Date().toISOString().split('T')[0],
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
    } finally {
      setLoading(false);
    }
  };

  const handleAnimalSelect = (animalId) => {
    const animal = animals.find(a => a.id === animalId);
    setSelectedAnimal(animal);
    setNewVaccination(prev => ({ 
      ...prev, 
      animal_id: animalId,
      vaccine_name: '' // Reset vaccine when animal changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newVaccination.animal_id || !newVaccination.vaccine_name) {
      toast.error('Please select animal and vaccine');
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
        route: '',
        administered_by: '',
        vaccination_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        remarks: '',
      });
      setSelectedAnimal(null);
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

  // Get vaccines for selected animal's species
  const availableVaccines = selectedAnimal 
    ? vaccinesBySpecies[selectedAnimal.species] || []
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Vaccinations
          </h1>
          <p className="text-slate-500 text-sm">Record vaccination history for your animals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Vaccination</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Animal Selection */}
              <div className="space-y-2">
                <Label>Select Animal *</Label>
                <Select 
                  value={newVaccination.animal_id}
                  onValueChange={handleAnimalSelect}
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

              {/* Vaccine Selection (Species-specific) */}
              {selectedAnimal && (
                <div className="space-y-2">
                  <Label>Vaccine Name *</Label>
                  <Select 
                    value={newVaccination.vaccine_name}
                    onValueChange={(val) => setNewVaccination({...newVaccination, vaccine_name: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVaccines.map(vaccine => (
                        <SelectItem key={vaccine} value={vaccine}>{vaccine}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Showing vaccines for {speciesDisplayNames[selectedAnimal.species]}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label>Date of Vaccination *</Label>
                <Input
                  type="date"
                  value={newVaccination.vaccination_date}
                  onChange={(e) => setNewVaccination({...newVaccination, vaccination_date: e.target.value})}
                />
              </div>

              {/* Dose and Route */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dose</Label>
                  <Input
                    placeholder="e.g., 2ml, 1 dose"
                    value={newVaccination.dose}
                    onChange={(e) => setNewVaccination({...newVaccination, dose: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select 
                    value={newVaccination.route}
                    onValueChange={(val) => setNewVaccination({...newVaccination, route: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {routeOptions.map(route => (
                        <SelectItem key={route.value} value={route.value}>{route.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Batch and Given By */}
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
                  <Label>Given By</Label>
                  <Input
                    placeholder="Vet/Paravet name"
                    value={newVaccination.administered_by}
                    onChange={(e) => setNewVaccination({...newVaccination, administered_by: e.target.value})}
                  />
                </div>
              </div>

              {/* Next Due Date */}
              <div className="space-y-2">
                <Label>Next Due Date</Label>
                <Input
                  type="date"
                  value={newVaccination.next_due_date}
                  onChange={(e) => setNewVaccination({...newVaccination, next_due_date: e.target.value})}
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Any additional notes"
                  value={newVaccination.remarks}
                  onChange={(e) => setNewVaccination({...newVaccination, remarks: e.target.value})}
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This is for recording vaccination history only. 
                  Vaccination should be done by qualified veterinary personnel.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={formLoading}>
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
                            {vacc.dose && <p className="text-xs text-slate-400">Dose: {vacc.dose}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatDate(vacc.date)}</Badge>
                          {vacc.administered_by && (
                            <p className="text-xs text-slate-500 mt-1">By: {vacc.administered_by}</p>
                          )}
                        </div>
                      </div>
                      
                      {vacc.next_due_date && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          <Calendar className="h-4 w-4" />
                          Next due: {formatDate(vacc.next_due_date)}
                        </div>
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

export default VaccinationsEnhanced;
