import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, BookOpen, ChevronRight, Filter } from 'lucide-react';
import { knowledgeCenterAPI } from '@/lib/api';
import { testCategoryDisplayNames, speciesDisplayNames } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const KnowledgeCenter = () => {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');

  const testCategories = [
    { key: 'all', label: 'All Tests' },
    { key: 'blood', label: 'Blood' },
    { key: 'dung', label: 'Dung/Fecal' },
    { key: 'milk', label: 'Milk' },
    { key: 'urine', label: 'Urine' },
    { key: 'nasal', label: 'Nasal' },
    { key: 'skin', label: 'Skin' },
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await knowledgeCenterAPI.getAll();
      setEntries(response.data);
    } catch (error) {
      toast.error('Failed to fetch knowledge center data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.test_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || entry.test_category === activeCategory;
    const matchesSpecies = speciesFilter === 'all' || entry.species === speciesFilter;
    return matchesSearch && matchesCategory && matchesSpecies;
  });

  // Group entries by test type
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.test_type]) {
      acc[entry.test_type] = [];
    }
    acc[entry.test_type].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Knowledge Center
          </h1>
          <p className="text-slate-500 text-sm">Reference data for diagnostic interpretation (READ-ONLY)</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" data-testid="add-entry-btn">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by test type..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-knowledge"
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {Object.entries(speciesDisplayNames).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          {testCategories.map(cat => (
            <TabsTrigger 
              key={cat.key} 
              value={cat.key}
              className="whitespace-nowrap"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(groupedEntries).length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No reference data found</p>
              <p className="text-sm text-slate-400 mt-2">
                Knowledge Center is currently empty. Admin can add reference data.
              </p>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedEntries).map(([testType, testEntries]) => (
                <AccordionItem key={testType} value={testType} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-slate-800">{testType}</h3>
                        <p className="text-xs text-slate-500">
                          {testEntries.length} species reference{testEntries.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {testEntries.map((entry) => (
                        <Card key={entry.id} className="bg-slate-50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline">{speciesDisplayNames[entry.species]}</Badge>
                              <Badge className="bg-slate-200 text-slate-700">
                                {testCategoryDisplayNames[entry.test_category]}
                              </Badge>
                            </div>

                            {entry.reference_data && (
                              <div className="space-y-3 text-sm">
                                {/* Normal Range */}
                                {(entry.reference_data.normal_min !== null || entry.reference_data.normal_max !== null) && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-700">Normal Range:</span>
                                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                      {entry.reference_data.normal_min} - {entry.reference_data.normal_max} {entry.reference_data.unit}
                                    </span>
                                  </div>
                                )}

                                {/* Increase Causes */}
                                {entry.reference_data.increase_causes?.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">If Increased:</span>
                                    <ul className="list-disc list-inside text-slate-600 mt-1">
                                      {entry.reference_data.increase_causes.map((cause, i) => (
                                        <li key={i}>{cause}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Decrease Causes */}
                                {entry.reference_data.decrease_causes?.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">If Decreased:</span>
                                    <ul className="list-disc list-inside text-slate-600 mt-1">
                                      {entry.reference_data.decrease_causes.map((cause, i) => (
                                        <li key={i}>{cause}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Special Symptoms */}
                                {entry.reference_data.special_symptoms?.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">Special Symptoms:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {entry.reference_data.special_symptoms.map((symptom, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {symptom}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Suggested Actions */}
                                {entry.reference_data.suggested_actions?.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">Suggested Actions:</span>
                                    <ul className="list-disc list-inside text-slate-600 mt-1">
                                      {entry.reference_data.suggested_actions.map((action, i) => (
                                        <li key={i}>{action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-lg">
        <p className="text-xs text-slate-600 text-center">
          <strong>Reference Information Only:</strong> This knowledge center provides clinical reference data. 
          All values and interpretations are for decision support only. 
          Final diagnosis must be made by a registered veterinarian.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeCenter;
