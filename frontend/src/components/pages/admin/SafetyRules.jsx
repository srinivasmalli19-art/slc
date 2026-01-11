import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Loader2, AlertTriangle, Edit2, Save, X,
  CheckCircle2, XCircle, Info, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const defaultDiseases = [
  'Brucellosis', 'Anthrax', 'Leptospirosis', 'Tuberculosis', 
  'Avian Influenza', 'Rabies', 'FMD'
];

const speciesOptions = Object.entries(speciesDisplayNames);

const SafetyRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    disease_name: '',
    species_affected: [],
    ppe_instructions: '',
    isolation_protocols: '',
    milk_meat_restriction: '',
    disposal_procedures: '',
    government_reporting: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get('/admin/safety-rules');
      setRules(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      toast.error('Failed to load safety rules');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        disease_name: rule.disease_name,
        species_affected: rule.species_affected || [],
        ppe_instructions: rule.ppe_instructions || '',
        isolation_protocols: rule.isolation_protocols || '',
        milk_meat_restriction: rule.milk_meat_restriction || '',
        disposal_procedures: rule.disposal_procedures || '',
        government_reporting: rule.government_reporting || '',
        is_active: rule.is_active !== false,
      });
    } else {
      setEditingRule(null);
      setFormData({
        disease_name: '',
        species_affected: [],
        ppe_instructions: '',
        isolation_protocols: '',
        milk_meat_restriction: '',
        disposal_procedures: '',
        government_reporting: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.disease_name || !formData.ppe_instructions) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingRule) {
        await api.put(`/admin/safety-rules/${editingRule.id}`, formData);
        toast.success('Safety rule updated successfully');
      } else {
        await api.post('/admin/safety-rules', formData);
        toast.success('Safety rule created successfully');
      }
      setDialogOpen(false);
      fetchRules();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecies = (species) => {
    setFormData(prev => ({
      ...prev,
      species_affected: prev.species_affected.includes(species)
        ? prev.species_affected.filter(s => s !== species)
        : [...prev.species_affected, species]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Safety & Zoonotic Rules
          </h1>
          <p className="text-slate-500 text-sm">Configure auto-trigger safety protocols for diseases</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2 bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4" />
          Add Safety Rule
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Critical Safety Configuration</p>
              <p className="text-sm text-red-700">
                Safety rules auto-trigger when vets/paravets diagnose these diseases. 
                These blocks are non-editable by clinical staff and appear in all related PDFs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-configured Diseases Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800">Pre-configured High-Risk Diseases</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {defaultDiseases.map(disease => (
                  <Badge key={disease} variant="outline" className="text-red-600 border-red-300">
                    {disease}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No safety rules configured</p>
          <p className="text-sm text-slate-400 mt-1">Add rules for zoonotic disease protocols</p>
          <Button className="mt-4" onClick={() => openDialog()}>
            Add First Rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`${rule.is_active ? 'border-red-200' : 'border-slate-200 opacity-60'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.is_active ? 'bg-red-100' : 'bg-slate-100'}`}>
                      <AlertTriangle className={`h-5 w-5 ${rule.is_active ? 'text-red-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rule.disease_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.is_active ? (
                          <Badge className="bg-green-100 text-green-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" />Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 gap-1">
                            <XCircle className="h-3 w-3" />Inactive
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">v{rule.version || 1}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openDialog(rule)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Species Affected */}
                {rule.species_affected && rule.species_affected.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Species Affected</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.species_affected.map(species => (
                        <Badge key={species} variant="outline" className="text-xs">
                          {speciesDisplayNames[species] || species}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="text-sm py-2">
                      View Safety Protocols
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {rule.ppe_instructions && (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs font-semibold text-amber-800 mb-1">PPE Instructions</p>
                            <p className="text-sm text-amber-700">{rule.ppe_instructions}</p>
                          </div>
                        )}
                        {rule.isolation_protocols && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-1">Isolation Protocols</p>
                            <p className="text-sm text-blue-700">{rule.isolation_protocols}</p>
                          </div>
                        )}
                        {rule.milk_meat_restriction && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs font-semibold text-red-800 mb-1">Milk/Meat Restrictions</p>
                            <p className="text-sm text-red-700">{rule.milk_meat_restriction}</p>
                          </div>
                        )}
                        {rule.disposal_procedures && (
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs font-semibold text-purple-800 mb-1">Disposal Procedures</p>
                            <p className="text-sm text-purple-700">{rule.disposal_procedures}</p>
                          </div>
                        )}
                        {rule.government_reporting && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs font-semibold text-green-800 mb-1">Government Reporting</p>
                            <p className="text-sm text-green-700">{rule.government_reporting}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <p className="text-xs text-slate-400 mt-2">
                  Last updated: {formatDate(rule.updated_at)} | Created by: {rule.created_by?.slice(0, 8)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Safety Rule' : 'Add Safety Rule'}</DialogTitle>
            <DialogDescription>
              Configure safety protocols for zoonotic disease alerts
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disease Name *</Label>
                <Select 
                  value={formData.disease_name}
                  onValueChange={(val) => handleChange('disease_name', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or enter disease" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultDiseases.map(disease => (
                      <SelectItem key={disease} value={disease}>{disease}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.disease_name === 'Other' && (
                  <Input
                    placeholder="Enter disease name"
                    onChange={(e) => handleChange('disease_name', e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                  <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Species Affected</Label>
              <div className="flex flex-wrap gap-2">
                {speciesOptions.map(([value, label]) => (
                  <Badge
                    key={value}
                    variant={formData.species_affected.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecies(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>PPE Instructions *</Label>
              <Textarea
                value={formData.ppe_instructions}
                onChange={(e) => handleChange('ppe_instructions', e.target.value)}
                placeholder="e.g., Wear gloves, N95 mask, protective eyewear, disposable gown..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Isolation Protocols</Label>
              <Textarea
                value={formData.isolation_protocols}
                onChange={(e) => handleChange('isolation_protocols', e.target.value)}
                placeholder="e.g., Isolate affected animals immediately, restrict movement..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Milk/Meat Restrictions</Label>
              <Textarea
                value={formData.milk_meat_restriction}
                onChange={(e) => handleChange('milk_meat_restriction', e.target.value)}
                placeholder="e.g., Do not consume milk or meat from affected animals..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Disposal Procedures</Label>
              <Textarea
                value={formData.disposal_procedures}
                onChange={(e) => handleChange('disposal_procedures', e.target.value)}
                placeholder="e.g., Deep burial or incineration of carcasses..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Government Reporting Instructions</Label>
              <Textarea
                value={formData.government_reporting}
                onChange={(e) => handleChange('government_reporting', e.target.value)}
                placeholder="e.g., Report to District Animal Husbandry Officer within 24 hours..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info Footer */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-600 text-center">
            Safety rules are version-controlled and audit-logged. 
            These protocols auto-display in vet/paravet screens, knowledge center, and all related PDFs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyRules;
