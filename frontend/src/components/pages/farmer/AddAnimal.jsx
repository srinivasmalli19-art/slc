import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { animalsAPI } from '@/lib/api';
import { speciesDisplayNames } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Species-specific breeds
const breedsBySpecies = {
  cattle: ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Tharparkar', 'Ongole', 'Kankrej', 'Hariana', 'Crossbred', 'Other'],
  buffalo: ['Murrah', 'Surti', 'Jaffarabadi', 'Mehsana', 'Nagpuri', 'Nili-Ravi', 'Bhadawari', 'Toda', 'Other'],
  sheep: ['Deccani', 'Nellore', 'Marwari', 'Chokla', 'Magra', 'Sonadi', 'Patanwadi', 'Mandya', 'Other'],
  goat: ['Jamunapari', 'Beetal', 'Barbari', 'Sirohi', 'Osmanabadi', 'Black Bengal', 'Marwari', 'Mehsana', 'Other'],
  pig: ['Large White Yorkshire', 'Landrace', 'Hampshire', 'Duroc', 'Desi', 'Crossbred', 'Other'],
  poultry: ['Desi/Country', 'Broiler', 'Layer', 'Kadaknath', 'Aseel', 'Rhode Island Red', 'White Leghorn', 'Other'],
  dog: ['Desi/Indian', 'German Shepherd', 'Labrador', 'Golden Retriever', 'Rottweiler', 'Doberman', 'Pomeranian', 'Other'],
  cat: ['Desi/Indian', 'Persian', 'Siamese', 'Maine Coon', 'Other'],
  horse: ['Marwari', 'Kathiawari', 'Thoroughbred', 'Arabian', 'Other'],
  donkey: ['Indian Donkey', 'Other'],
  camel: ['Bikaneri', 'Jaisalmeri', 'Kachchhi', 'Mewari', 'Other'],
};

// Status options based on species and age
const getStatusOptions = (species, ageMonths) => {
  const age = parseInt(ageMonths) || 0;
  
  // For poultry
  if (species === 'poultry') {
    return [
      { value: 'chick', label: 'Chick' },
      { value: 'grower', label: 'Grower' },
      { value: 'layer', label: 'Layer' },
      { value: 'broiler', label: 'Broiler' },
    ];
  }
  
  // For pets
  if (['dog', 'cat'].includes(species)) {
    return [
      { value: 'puppy_kitten', label: age < 12 ? 'Puppy/Kitten' : 'Young' },
      { value: 'adult', label: 'Adult' },
      { value: 'senior', label: 'Senior' },
    ];
  }
  
  // For livestock (cattle, buffalo, sheep, goat, pig)
  const options = [];
  
  // Calf only if age <= 36 months (3 years)
  if (age <= 36) {
    options.push({ value: 'calf', label: 'Calf / Young' });
  }
  
  options.push({ value: 'heifer', label: 'Heifer / Growing' });
  options.push({ value: 'pregnant', label: 'Pregnant' });
  
  if (['cattle', 'buffalo', 'goat', 'sheep'].includes(species)) {
    options.push({ value: 'milking', label: 'Milking' });
    options.push({ value: 'dry', label: 'Dry' });
  }
  
  options.push({ value: 'breeding', label: 'For Breeding' });
  
  return options;
};

const animalSchema = z.object({
  tag_id: z.string().min(1, 'Tag number is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  age_months: z.coerce.number().min(0, 'Age must be positive'),
  gender: z.string().min(1, 'Sex is required'),
  status: z.string().min(1, 'Status is required'),
  color: z.string().optional(),
  weight_kg: z.coerce.number().optional(),
  identification_marks: z.string().optional(),
  origin: z.string().optional(),
  notes: z.string().optional(),
});

const AddAnimalEnhanced = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const form = useForm({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      tag_id: '',
      species: '',
      breed: '',
      age_months: '',
      gender: '',
      status: 'healthy',
      color: '',
      weight_kg: '',
      identification_marks: '',
      origin: 'born',
      notes: '',
    },
  });

  const watchSpecies = form.watch('species');
  const watchAge = form.watch('age_months');
  const watchGender = form.watch('gender');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await animalsAPI.create({
        ...data,
        age_months: parseInt(data.age_months),
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
      });
      toast.success('Animal registered successfully!');
      navigate('/farmer/animals');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register animal');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['species', 'breed', 'tag_id'];
    if (step === 2) fieldsToValidate = ['age_months', 'gender', 'status'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const speciesOptions = Object.entries(speciesDisplayNames);
  const breedOptions = watchSpecies ? breedsBySpecies[watchSpecies] || [] : [];
  const statusOptions = getStatusOptions(watchSpecies, watchAge);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => step > 1 ? prevStep() : navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Register New Animal
          </h1>
          <p className="text-slate-500 text-sm">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step > s ? 'bg-green-500 text-white' : 
              step === s ? 'bg-primary text-white' : 
              'bg-slate-200 text-slate-500'
            }`}>
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: Species & Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Animal Type</CardTitle>
              <CardDescription>Choose species and enter tag number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Species Selection as Grid */}
              <div className="space-y-2">
                <Label>Species *</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {speciesOptions.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        form.setValue('species', value);
                        form.setValue('breed', ''); // Reset breed when species changes
                      }}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        watchSpecies === value
                          ? 'border-primary bg-green-50 text-primary'
                          : 'border-slate-200 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                {form.formState.errors.species && (
                  <p className="text-sm text-red-500">{form.formState.errors.species.message}</p>
                )}
              </div>

              {/* Breed Selection */}
              {watchSpecies && (
                <div className="space-y-2">
                  <Label>Breed *</Label>
                  <Select 
                    value={form.watch('breed')}
                    onValueChange={(val) => form.setValue('breed', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breedOptions.map((breed) => (
                        <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.breed && (
                    <p className="text-sm text-red-500">{form.formState.errors.breed.message}</p>
                  )}
                </div>
              )}

              {/* Tag Number */}
              <div className="space-y-2">
                <Label>Tag Number / ID *</Label>
                <Input
                  placeholder="Enter unique tag number"
                  {...form.register('tag_id')}
                />
                {form.formState.errors.tag_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.tag_id.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Age, Sex, Status */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Animal Details</CardTitle>
              <CardDescription>Enter age, sex, and current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Age */}
              <div className="space-y-2">
                <Label>Age (in months) *</Label>
                <Input
                  type="number"
                  placeholder="Enter age in months"
                  {...form.register('age_months')}
                />
                <p className="text-xs text-slate-500">
                  {watchAge && parseInt(watchAge) >= 12 
                    ? `Approximately ${Math.floor(parseInt(watchAge) / 12)} year(s) ${parseInt(watchAge) % 12} month(s)`
                    : 'Enter age in months (e.g., 24 for 2 years)'}
                </p>
                {form.formState.errors.age_months && (
                  <p className="text-sm text-red-500">{form.formState.errors.age_months.message}</p>
                )}
              </div>

              {/* Sex */}
              <div className="space-y-2">
                <Label>Sex *</Label>
                <RadioGroup 
                  value={form.watch('gender')}
                  onValueChange={(val) => form.setValue('gender', val)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Current Status *</Label>
                <Select 
                  value={form.watch('status')}
                  onValueChange={(val) => form.setValue('status', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <Label>Born or Purchased?</Label>
                <RadioGroup 
                  value={form.watch('origin')}
                  onValueChange={(val) => form.setValue('origin', val)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="born" id="born" />
                    <Label htmlFor="born" className="cursor-pointer">Born in Farm</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purchased" id="purchased" />
                    <Label htmlFor="purchased" className="cursor-pointer">Purchased</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Optional details for better identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    placeholder="e.g., Black, Brown"
                    {...form.register('color')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Weight in kg"
                    {...form.register('weight_kg')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Identification Marks</Label>
                <Textarea
                  placeholder="Any unique marks like spots, scars, etc."
                  {...form.register('identification_marks')}
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Any additional notes"
                  {...form.register('notes')}
                />
              </div>

              {/* Summary */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-slate-500">Species:</span> {speciesDisplayNames[watchSpecies]}</p>
                    <p><span className="text-slate-500">Breed:</span> {form.watch('breed')}</p>
                    <p><span className="text-slate-500">Tag:</span> {form.watch('tag_id')}</p>
                    <p><span className="text-slate-500">Sex:</span> {form.watch('gender')}</p>
                    <p><span className="text-slate-500">Age:</span> {form.watch('age_months')} months</p>
                    <p><span className="text-slate-500">Status:</span> {form.watch('status')}</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button type="button" onClick={nextStep} className="flex-1">
              Save & Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Register Animal
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddAnimalEnhanced;
