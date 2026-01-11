import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Loader2, CheckCircle2, XCircle, MapPin,
  Phone, ChevronRight, Eye, Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyDialog, setVerifyDialog] = useState({ open: false, institution: null });
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/vet/institutions');
      setInstitutions(response.data);
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verified) => {
    setVerifyLoading(true);
    try {
      await api.put(`/admin/institutions/${verifyDialog.institution.id}/verify`, null, {
        params: { verified, remarks: verifyRemarks }
      });
      toast.success(`Institution ${verified ? 'verified' : 'verification revoked'} successfully`);
      setVerifyDialog({ open: false, institution: null });
      setVerifyRemarks('');
      fetchInstitutions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter(inst => 
    inst.institution_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: institutions.length,
    verified: institutions.filter(i => i.is_verified).length,
    pending: institutions.filter(i => !i.is_verified).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Institution Management
          </h1>
          <p className="text-slate-500 text-sm">Verify and manage registered institutions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-sm text-slate-500">Total Institutions</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
            <p className="text-sm text-green-600">Verified</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-sm text-amber-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, district, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Institutions List */}
      {filteredInstitutions.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No institutions found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInstitutions.map((inst) => (
            <Card key={inst.id} className={`${!inst.is_verified ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${inst.is_verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Building2 className={`h-6 w-6 ${inst.is_verified ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{inst.institution_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="h-4 w-4" />
                        {inst.location}
                      </div>
                      <p className="text-sm text-slate-500">
                        {inst.mandal && `${inst.mandal}, `}{inst.district}, {inst.state}
                      </p>
                      {inst.contact_number && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Phone className="h-4 w-4" />
                          {inst.contact_number}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {inst.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 gap-1">
                        Pending Verification
                      </Badge>
                    )}
                    <p className="text-xs text-slate-400">Added: {formatDate(inst.created_at)}</p>
                  </div>
                </div>

                {inst.jurisdiction_villages && inst.jurisdiction_villages.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">Jurisdiction Villages:</p>
                    <div className="flex flex-wrap gap-2">
                      {inst.jurisdiction_villages.map((village, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {village}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {inst.verification_date && `Verified on: ${formatDate(inst.verification_date)}`}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setVerifyDialog({ open: true, institution: inst })}
                  >
                    {inst.is_verified ? 'Manage' : 'Verify'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open) => !open && setVerifyDialog({ open: false, institution: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyDialog.institution?.is_verified ? 'Manage Institution' : 'Verify Institution'}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog.institution?.institution_name}
            </DialogDescription>
          </DialogHeader>

          {verifyDialog.institution && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Location</p>
                  <p className="font-medium">{verifyDialog.institution.location}</p>
                </div>
                <div>
                  <p className="text-slate-500">District</p>
                  <p className="font-medium">{verifyDialog.institution.district}, {verifyDialog.institution.state}</p>
                </div>
                <div>
                  <p className="text-slate-500">Contact</p>
                  <p className="font-medium">{verifyDialog.institution.contact_number || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  {verifyDialog.institution.is_verified ? (
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Add verification remarks..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVerifyDialog({ open: false, institution: null })}>
              Cancel
            </Button>
            {verifyDialog.institution?.is_verified ? (
              <Button 
                variant="destructive"
                onClick={() => handleVerify(false)}
                disabled={verifyLoading}
              >
                {verifyLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Revoke Verification
              </Button>
            ) : (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleVerify(true)}
                disabled={verifyLoading}
              >
                {verifyLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify Institution
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-600 text-center">
            Verified institutions are locked and cannot be edited by users. 
            Revoke verification to allow edits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionManagement;
