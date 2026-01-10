import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Loader2, Heart, Calendar, Baby } from 'lucide-react';
import { breedingAPI, animalsAPI } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';
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
  { key: 'others', label: 'Others', species: ['pig', 'dog', 'cat', 'horse', 'donkey'] },
];

const breedingTypes = [
  { value: 'natural', label: 'Natural Mating' },
  { value: 'ai', label: 'Artificial Insemination (AI)' },
];

const Breeding = () => {
  const navigate = useNavigate();
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newBreeding, setNewBreeding] = useState({
    animal_id: '',
    breeding_type: '',
    sire_details: '',
    semen_batch: '',
    inseminator: '',
    expected_calving: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [breedingResponse, animalsResponse] = await Promise.all([
        breedingAPI.getAll(),
        animalsAPI.getAll(),
      ]);
      setBreedingRecords(breedingResponse.data);
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
    if (!newBreeding.animal_id || !newBreeding.breeding_type) {
      toast.error('Please fill in required fields');
      return;
    }

    setFormLoading(true);
    try {
      await breedingAPI.create(newBreeding);
      toast.success('Breeding record added!');
      setDialogOpen(false);
      setNewBreeding({
        animal_id: '',
        breeding_type: '',
        sire_details: '',
        semen_batch: '',
        inseminator: '',
        expected_calving: '',
        remarks: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add breeding record');
    } finally {
      setFormLoading(false);
    }
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  // Filter only female animals for breeding
  const femaleAnimals = animals.filter(a => a.gender === 'female');

  const filteredRecords = breedingRecords.filter(record => {
    if (activeCategory === 'all') return true;
    const animal = getAnimalById(record.animal_id);
    if (!animal) return false;
    const category = speciesCategories.find(c => c.key === activeCategory);
    return category?.species?.includes(animal.species);
  });

  const isExpectingWithin30Days = (expectedDate) => {
    if (!expectedDate) return false;
    const expected = new Date(expectedDate);
    const now = new Date();
    const diffDays = Math.ceil((expected - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Breeding / AI Records
          </h1>
          <p className="text-slate-500 text-sm">Track breeding and artificial insemination history</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-breeding-btn">
              <Plus className="h-4 w-4" />
              Add Breeding Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Breeding / AI Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Animal (Female) *</Label>
                <Select 
                  value={newBreeding.animal_id}
                  onValueChange={(val) => setNewBreeding({...newBreeding, animal_id: val})}
                >
                  <SelectTrigger data-testid="select-animal-breeding">
                    <SelectValue placeholder="Choose female animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {femaleAnimals.length === 0 ? (
                      <SelectItem value="none" disabled>No female animals found</SelectItem>
                    ) : (
                      femaleAnimals.map(animal => (
                        <SelectItem key={animal.id} value={animal.id}>
                          {animal.tag_id} - {animal.breed} ({animal.species})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Breeding Type *</Label>
                <Select 
                  value={newBreeding.breeding_type}
                  onValueChange={(val) => setNewBreeding({...newBreeding, breeding_type: val})}
                >
                  <SelectTrigger data-testid="breeding-type-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {breedingTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sire/Bull Details</Label>
                <Input
                  placeholder="Bull name, tag ID, or breed"
                  value={newBreeding.sire_details}
                  onChange={(e) => setNewBreeding({...newBreeding, sire_details: e.target.value})}
                  data-testid="sire-details-input"
                />
              </div>

              {newBreeding.breeding_type === 'ai' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Semen Batch No.</Label>
                    <Input
                      placeholder="Batch number"
                      value={newBreeding.semen_batch}
                      onChange={(e) => setNewBreeding({...newBreeding, semen_batch: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inseminator</Label>
                    <Input
                      placeholder="AI technician name"
                      value={newBreeding.inseminator}
                      onChange={(e) => setNewBreeding({...newBreeding, inseminator: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Expected Calving Date</Label>
                <Input
                  type="date"
                  value={newBreeding.expected_calving}
                  onChange={(e) => setNewBreeding({...newBreeding, expected_calving: e.target.value})}
                  data-testid="expected-calving-date"
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Any additional notes (heat signs, previous history, etc.)"
                  value={newBreeding.remarks}
                  onChange={(e) => setNewBreeding({...newBreeding, remarks: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full" disabled={formLoading} data-testid="submit-breeding-btn">
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
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No breeding records found</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                Add your first record
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => {
                const animal = getAnimalById(record.animal_id);
                const expectingSoon = isExpectingWithin30Days(record.expected_calving);
                
                return (
                  <Card 
                    key={record.id} 
                    className={`hover:shadow-md transition-shadow ${expectingSoon ? 'border-pink-300 bg-pink-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expectingSoon ? 'bg-pink-100' : 'bg-pink-100'}`}>
                            {expectingSoon ? (
                              <Baby className="h-5 w-5 text-pink-600" />
                            ) : (
                              <Heart className="h-5 w-5 text-pink-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {record.breeding_type === 'ai' ? 'Artificial Insemination' : 'Natural Mating'}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown Animal'}
                            </p>
                            {record.sire_details && (
                              <p className="text-xs text-slate-400">Sire: {record.sire_details}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatDate(record.date)}</Badge>
                          {record.breeding_type === 'ai' && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">AI</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* AI specific details */}
                      {record.breeding_type === 'ai' && (record.semen_batch || record.inseminator) && (
                        <div className="mt-3 flex gap-4 text-xs text-slate-500">
                          {record.semen_batch && <span>Batch: {record.semen_batch}</span>}
                          {record.inseminator && <span>Technician: {record.inseminator}</span>}
                        </div>
                      )}
                      
                      {record.expected_calving && (
                        <div className={`mt-3 flex items-center gap-2 text-sm p-2 rounded ${
                          expectingSoon ? 'text-pink-600 bg-pink-100' : 'text-slate-600 bg-slate-100'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          {expectingSoon ? '🍼 Expected calving soon: ' : 'Expected calving: '}
                          {formatDate(record.expected_calving)}
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

export default Breeding;
