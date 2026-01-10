import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { diagnosticsAPI, animalsAPI } from '../../../lib/api';
import { speciesDisplayNames, testCategoryDisplayNames } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { toast } from 'sonner';

const diagnosticSchema = z.object({
  animal_id: z.string().min(1, 'Animal is required'),
  test_category: z.string().min(1, 'Test category is required'),
  test_type: z.string().min(1, 'Test type is required'),
  species: z.string().min(1, 'Species is required'),
  value: z.coerce.number().optional(),
  value_text: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const testTypesByCategory = {
  blood: ['CBC', 'Hemoglobin', 'PCV', 'WBC Count', 'RBC Count', 'Platelet Count', 'Blood Glucose', 'BUN', 'Creatinine', 'ALT', 'AST', 'Brucella Antibody Test'],
  dung: ['Fecal Egg Count', 'Coccidia', 'Worm Identification', 'Giardia', 'Cryptosporidium'],
  milk: ['Somatic Cell Count', 'Fat Content', 'Protein Content', 'SNF', 'Mastitis Test', 'Brucella Ring Test'],
  urine: ['pH', 'Specific Gravity', 'Protein', 'Glucose', 'Blood', 'Ketones'],
  nasal: ['Bacterial Culture', 'Viral PCR', 'IBR', 'PI3', 'BRSV'],
  skin: ['Fungal Culture', 'Mange Mites', 'Lice', 'Ringworm', 'Dermatophytosis'],
};

const commonSymptoms = [
  'Fever', 'Loss of appetite', 'Weight loss', 'Lethargy', 'Coughing',
  'Nasal discharge', 'Diarrhea', 'Lameness', 'Skin lesions', 'Swollen lymph nodes',
  'Abortion', 'Reduced milk yield', 'Respiratory distress', 'Eye discharge'
];

const NewDiagnostic = () => {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isPositiveNegative, setIsPositiveNegative] = useState(false);

  const form = useForm({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      animal_id: '',
      test_category: '',
      test_type: '',
      species: '',
      value: '',
      value_text: '',
      unit: '',
      notes: '',
    },
  });

  const watchCategory = form.watch('test_category');
  const watchAnimalId = form.watch('animal_id');

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    if (watchAnimalId) {
      const animal = animals.find(a => a.id === watchAnimalId);
      if (animal) {
        form.setValue('species', animal.species);
      }
    }
  }, [watchAnimalId, animals]);

  const fetchAnimals = async () => {
    try {
      const response = await animalsAPI.getAll();
      setAnimals(response.data);
    } catch (error) {
      toast.error('Failed to fetch animals');
    } finally {
      setFetchLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        value: data.value ? parseFloat(data.value) : null,
        symptoms: selectedSymptoms,
      };
      
      const response = await diagnosticsAPI.create(submitData);
      
      // Check if there's a safety alert
      if (response.data.interpretation?.safety_alert) {
        toast.warning('⚠️ HIGH-RISK DISEASE DETECTED - Safety protocols required!', {
          duration: 5000,
        });
      } else {
        toast.success('Diagnostic test recorded successfully!');
      }
      
      navigate('/vet/diagnostics');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record diagnostic');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
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
            New Diagnostic Test
          </h1>
          <p className="text-slate-500 text-sm">Enter test results for interpretation</p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Clinical Reference Only</p>
              <p className="text-amber-700">
                This system provides decision support. Final diagnosis and treatment 
                must be made by a registered veterinarian.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Animal Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Animal Information</CardTitle>
            <CardDescription>Select the animal for this diagnostic test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Animal *</Label>
              <Select 
                onValueChange={(val) => form.setValue('animal_id', val)}
                disabled={fetchLoading}
              >
                <SelectTrigger data-testid="select-animal">
                  <SelectValue placeholder={fetchLoading ? "Loading..." : "Choose animal"} />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.tag_id} - {animal.breed} ({speciesDisplayNames[animal.species]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.animal_id && (
                <p className="text-sm text-red-500">{form.formState.errors.animal_id.message}</p>
              )}
            </div>

            <input type="hidden" {...form.register('species')} />
          </CardContent>
        </Card>

        {/* Test Details */}
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
            <CardDescription>Enter the diagnostic test information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Category *</Label>
                <Select 
                  onValueChange={(val) => {
                    form.setValue('test_category', val);
                    form.setValue('test_type', '');
                  }}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(testCategoryDisplayNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.test_category && (
                  <p className="text-sm text-red-500">{form.formState.errors.test_category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Test Type *</Label>
                <Select 
                  onValueChange={(val) => {
                    form.setValue('test_type', val);
                    // Check if this is a positive/negative type test
                    const posNegTests = ['Brucella Antibody Test', 'Brucella Ring Test', 'Mastitis Test'];
                    setIsPositiveNegative(posNegTests.includes(val));
                  }}
                  disabled={!watchCategory}
                >
                  <SelectTrigger data-testid="select-test-type">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchCategory && testTypesByCategory[watchCategory]?.map(test => (
                      <SelectItem key={test} value={test}>{test}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.test_type && (
                  <p className="text-sm text-red-500">{form.formState.errors.test_type.message}</p>
                )}
              </div>
            </div>

            {/* Test Value */}
            {isPositiveNegative ? (
              <div className="space-y-2">
                <Label>Result *</Label>
                <Select 
                  onValueChange={(val) => form.setValue('value_text', val)}
                >
                  <SelectTrigger data-testid="select-result">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter numeric value"
                    {...form.register('value')}
                    data-testid="value-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    placeholder="e.g., mg/dL, %, cells/µL"
                    {...form.register('unit')}
                    data-testid="unit-input"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle>Observed Symptoms</CardTitle>
            <CardDescription>Select any symptoms observed in the animal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={selectedSymptoms.includes(symptom)}
                    onCheckedChange={() => toggleSymptom(symptom)}
                  />
                  <label
                    htmlFor={symptom}
                    className="text-sm cursor-pointer"
                  >
                    {symptom}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter any additional observations or notes..."
              {...form.register('notes')}
              data-testid="notes-input"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={loading}
            data-testid="submit-diagnostic-btn"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit & Interpret
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewDiagnostic;
