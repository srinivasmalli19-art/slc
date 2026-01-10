import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Syringe, Bug, Heart, Clock, Loader2 } from 'lucide-react';
import { animalsAPI, vaccinationsAPI, dewormingAPI, breedingAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const AlertsReminders = ({ type = 'all' }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(type === 'all' ? 'vaccination' : type);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [vaccResponse, dewormResponse, breedResponse, animalsResponse] = await Promise.all([
        vaccinationsAPI.getAll(),
        dewormingAPI.getAll(),
        breedingAPI.getAll(),
        animalsAPI.getAll(),
      ]);

      const animals = animalsResponse.data;
      const getAnimal = (id) => animals.find(a => a.id === id);

      // Process vaccination alerts
      const vaccAlerts = vaccResponse.data
        .filter(v => v.next_due_date)
        .map(v => {
          const animal = getAnimal(v.animal_id);
          const dueDate = new Date(v.next_due_date);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return {
            id: `vacc-${v.id}`,
            type: 'vaccination',
            animal: animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown',
            item: v.vaccine_name,
            dueDate: v.next_due_date,
            daysUntil,
            status: daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'due-soon' : 'upcoming',
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);

      // Process deworming alerts
      const dewormAlerts = dewormResponse.data
        .filter(d => d.next_due_date)
        .map(d => {
          const animal = getAnimal(d.animal_id);
          const dueDate = new Date(d.next_due_date);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return {
            id: `deworm-${d.id}`,
            type: 'deworming',
            animal: animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown',
            item: d.drug_name,
            dueDate: d.next_due_date,
            daysUntil,
            status: daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'due-soon' : 'upcoming',
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);

      // Process breeding alerts
      const breedAlerts = breedResponse.data
        .filter(b => b.expected_calving)
        .map(b => {
          const animal = getAnimal(b.animal_id);
          const dueDate = new Date(b.expected_calving);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return {
            id: `breed-${b.id}`,
            type: 'breeding',
            animal: animal ? `${animal.tag_id} - ${animal.breed}` : 'Unknown',
            item: 'Expected Calving',
            dueDate: b.expected_calving,
            daysUntil,
            status: daysUntil < 0 ? 'overdue' : daysUntil <= 30 ? 'due-soon' : 'upcoming',
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);

      setAlerts({
        vaccination: vaccAlerts,
        deworming: dewormAlerts,
        breeding: breedAlerts,
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (alertType) => {
    switch (alertType) {
      case 'vaccination': return Syringe;
      case 'deworming': return Bug;
      case 'breeding': return Heart;
      default: return Bell;
    }
  };

  const getStatusBadge = (status, daysUntil) => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue by {Math.abs(daysUntil)} days</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-100 text-amber-800">{daysUntil === 0 ? 'Due Today!' : `Due in ${daysUntil} days`}</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">In {daysUntil} days</Badge>;
    }
  };

  const renderAlertList = (alertList, alertType) => {
    if (alertList.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No {alertType} reminders</p>
          <p className="text-sm text-slate-400 mt-1">All caught up!</p>
        </Card>
      );
    }

    const Icon = getIcon(alertType);

    return (
      <div className="space-y-3">
        {alertList.map((alert) => (
          <Card 
            key={alert.id} 
            className={`hover:shadow-md transition-shadow ${
              alert.status === 'overdue' ? 'border-l-4 border-l-red-500 bg-red-50' :
              alert.status === 'due-soon' ? 'border-l-4 border-l-amber-500 bg-amber-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    alert.status === 'overdue' ? 'bg-red-100' :
                    alert.status === 'due-soon' ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      alert.status === 'overdue' ? 'text-red-600' :
                      alert.status === 'due-soon' ? 'text-amber-600' : 'text-slate-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{alert.animal}</h3>
                    <p className="text-sm text-slate-500">{alert.item}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(alert.status, alert.daysUntil)}
                  <p className="text-xs text-slate-400 mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(alert.dueDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOverdue = 
    (alerts.vaccination?.filter(a => a.status === 'overdue').length || 0) +
    (alerts.deworming?.filter(a => a.status === 'overdue').length || 0) +
    (alerts.breeding?.filter(a => a.status === 'overdue').length || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Alerts & Reminders
        </h1>
        <p className="text-slate-500 text-sm">Keep track of important due dates</p>
      </div>

      {/* Alert Summary */}
      {totalOverdue > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">{totalOverdue} overdue item(s)!</p>
                <p className="text-sm text-red-600">Please take action soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="vaccination" className="gap-2">
            <Syringe className="h-4 w-4" />
            Vaccination
            {alerts.vaccination?.filter(a => a.status !== 'upcoming').length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {alerts.vaccination.filter(a => a.status !== 'upcoming').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deworming" className="gap-2">
            <Bug className="h-4 w-4" />
            Deworming
            {alerts.deworming?.filter(a => a.status !== 'upcoming').length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {alerts.deworming.filter(a => a.status !== 'upcoming').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="breeding" className="gap-2">
            <Heart className="h-4 w-4" />
            Breeding/PD
            {alerts.breeding?.filter(a => a.status !== 'upcoming').length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {alerts.breeding.filter(a => a.status !== 'upcoming').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vaccination" className="mt-4">
          {renderAlertList(alerts.vaccination || [], 'vaccination')}
        </TabsContent>

        <TabsContent value="deworming" className="mt-4">
          {renderAlertList(alerts.deworming || [], 'deworming')}
        </TabsContent>

        <TabsContent value="breeding" className="mt-4">
          {renderAlertList(alerts.breeding || [], 'breeding')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsReminders;
