import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, AlertTriangle, FileDown, Eye } from 'lucide-react';
import { diagnosticsAPI, animalsAPI } from '../../../lib/api';
import { formatDate, testCategoryDisplayNames, statusColors, speciesDisplayNames } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { toast } from 'sonner';

const Diagnostics = () => {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diagResponse, animalsResponse] = await Promise.all([
        diagnosticsAPI.getAll(),
        animalsAPI.getAll(),
      ]);
      setDiagnostics(diagResponse.data);
      setAnimals(animalsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch diagnostics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getAnimalById = (id) => animals.find(a => a.id === id);

  const filteredDiagnostics = diagnostics.filter(diag => {
    const animal = getAnimalById(diag.animal_id);
    const matchesSearch = 
      diag.test_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal?.tag_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && diag.test_category === activeCategory;
  });

  const handleDownloadPDF = async (diagnosticId) => {
    try {
      const response = await diagnosticsAPI.getPDF(diagnosticId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnostic_report_${diagnosticId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const getStatusBadge = (status) => {
    const colorClass = statusColors[status] || 'bg-slate-100 text-slate-800';
    return (
      <Badge className={colorClass}>
        {status?.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Diagnostic Tests
          </h1>
          <p className="text-slate-500 text-sm">Enter and interpret diagnostic results</p>
        </div>
        <Button 
          onClick={() => navigate('/vet/diagnostics/new')}
          className="gap-2"
          data-testid="new-diagnostic-btn"
        >
          <Plus className="h-4 w-4" />
          New Diagnostic
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by test type or animal tag..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-diagnostics"
        />
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
          ) : filteredDiagnostics.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No diagnostic records found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/vet/diagnostics/new')}
              >
                Create new diagnostic
              </Button>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDiagnostics.map((diag) => {
                      const animal = getAnimalById(diag.animal_id);
                      const hasSafetyAlert = diag.interpretation?.safety_alert;
                      
                      return (
                        <TableRow 
                          key={diag.id}
                          className={hasSafetyAlert ? 'bg-red-50' : ''}
                        >
                          <TableCell className="font-medium">
                            {formatDate(diag.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{animal?.tag_id || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">
                                {speciesDisplayNames[animal?.species] || ''} - {animal?.breed || ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{diag.test_type}</p>
                              <p className="text-xs text-slate-500">
                                {testCategoryDisplayNames[diag.test_category]}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {diag.value || diag.value_text || 'N/A'} {diag.unit || ''}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(diag.interpretation?.status)}
                              {hasSafetyAlert && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDiagnostic(diag);
                                  setDetailsOpen(true);
                                }}
                                data-testid={`view-details-${diag.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(diag.id)}
                                data-testid={`download-pdf-${diag.id}`}
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnostic Details</DialogTitle>
          </DialogHeader>
          {selectedDiagnostic && (
            <div className="space-y-6 mt-4">
              {/* Safety Alert */}
              {selectedDiagnostic.interpretation?.safety_alert && (
                <div className="safety-alert">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    SAFETY ALERT: {selectedDiagnostic.interpretation.safety_alert.disease}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>PPE Requirements:</strong></p>
                    <ul className="list-disc list-inside text-red-700">
                      {selectedDiagnostic.interpretation.safety_alert.ppe_requirements?.slice(0, 3).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                    <p className="mt-2"><strong>Public Health:</strong></p>
                    <p className="text-red-700">{selectedDiagnostic.interpretation.safety_alert.public_health_advice}</p>
                  </div>
                </div>
              )}

              {/* Test Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Test Category</p>
                  <p className="font-medium">{testCategoryDisplayNames[selectedDiagnostic.test_category]}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Test Type</p>
                  <p className="font-medium">{selectedDiagnostic.test_type}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Value</p>
                  <p className="font-medium">
                    {selectedDiagnostic.value || selectedDiagnostic.value_text || 'N/A'} {selectedDiagnostic.unit || ''}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Status</p>
                  {getStatusBadge(selectedDiagnostic.interpretation?.status)}
                </div>
              </div>

              {/* Interpretation */}
              {selectedDiagnostic.interpretation && (
                <div className="space-y-4">
                  {selectedDiagnostic.interpretation.normal_range && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Normal Range</p>
                      <p className="text-slate-600">{selectedDiagnostic.interpretation.normal_range}</p>
                    </div>
                  )}

                  {selectedDiagnostic.interpretation.possible_conditions?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Possible Conditions</p>
                      <ul className="list-disc list-inside text-slate-600">
                        {selectedDiagnostic.interpretation.possible_conditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedDiagnostic.interpretation.suggested_actions?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Suggested Actions</p>
                      <ul className="list-disc list-inside text-slate-600">
                        {selectedDiagnostic.interpretation.suggested_actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => handleDownloadPDF(selectedDiagnostic.id)}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF Report
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 text-center">
                <strong>DISCLAIMER:</strong> This interpretation is for reference only. 
                Final diagnosis must be made by a registered veterinarian.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Diagnostics;
