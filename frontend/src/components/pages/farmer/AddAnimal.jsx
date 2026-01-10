import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { animalsAPI } from '@/lib/api';
import { speciesDisplayNames } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const animalSchema = z.object({
  tag_id: z.string().min(1, 'Tag ID is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  age_months: z.coerce.number().min(0, 'Age must be positive'),
  gender: z.string().min(1, 'Gender is required'),
  status: z.string().optional(),
  color: z.string().optional(),
  weight_kg: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const AddAnimal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
      notes: '',
    },
  });

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

  const speciesOptions = Object.entries(speciesDisplayNames);
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];
  const statusOptions = [
    { value: 'healthy', label: 'Healthy' },
    { value: 'sick', label: 'Sick' },
    { value: 'pregnant', label: 'Pregnant' },
    { value: 'milking', label: 'Milking' },
    { value: 'dry', label: 'Dry' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          data-testid="back-btn"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Add New Animal
          </h1>
          <p className="text-slate-500 text-sm">Register your livestock</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div className={`step-indicator ${step >= s ? 'active' : 'pending'}`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 2 && (
              <div className={`w-16 h-1 rounded ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 ? 'Basic Information' : 'Additional Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tag_id">Tag ID *</Label>
                  <Input
                    id="tag_id"
                    placeholder="Enter unique tag ID"
                    {...form.register('tag_id')}
                    data-testid="tag-id-input"
                  />
                  {form.formState.errors.tag_id && (
                    <p className="text-sm text-red-500">{form.formState.errors.tag_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select 
                    onValueChange={(val) => form.setValue('species', val)}
                    defaultValue={form.getValues('species')}
                  >
                    <SelectTrigger data-testid="species-select">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {speciesOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.species && (
                    <p className="text-sm text-red-500">{form.formState.errors.species.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Breed *</Label>
                  <Input
                    id="breed"
                    placeholder="Enter breed"
                    {...form.register('breed')}
                    data-testid="breed-input"
                  />
                  {form.formState.errors.breed && (
                    <p className="text-sm text-red-500">{form.formState.errors.breed.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age_months">Age (months) *</Label>
                    <Input
                      id="age_months"
                      type="number"
                      placeholder="Age in months"
                      {...form.register('age_months')}
                      data-testid="age-input"
                    />
                    {form.formState.errors.age_months && (
                      <p className="text-sm text-red-500">{form.formState.errors.age_months.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      onValueChange={(val) => form.setValue('gender', val)}
                      defaultValue={form.getValues('gender')}
                    >
                      <SelectTrigger data-testid="gender-select">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gender && (
                      <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => {
                    const fields = ['tag_id', 'species', 'breed', 'age_months', 'gender'];
                    form.trigger(fields).then(isValid => {
                      if (isValid) setStep(2);
                    });
                  }}
                  data-testid="next-step-btn"
                >
                  Next Step
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    onValueChange={(val) => form.setValue('status', val)}
                    defaultValue={form.getValues('status') || 'healthy'}
                  >
                    <SelectTrigger data-testid="status-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Animal color"
                      {...form.register('color')}
                      data-testid="color-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      placeholder="Weight in kg"
                      {...form.register('weight_kg')}
                      data-testid="weight-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    {...form.register('notes')}
                    data-testid="notes-input"
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                    data-testid="prev-step-btn"
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading}
                    data-testid="submit-animal-btn"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Register Animal
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddAnimal;
