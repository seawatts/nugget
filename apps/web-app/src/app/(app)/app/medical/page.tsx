'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Pill,
  Plus,
  Shield,
  Syringe,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

type Tab =
  | 'vaccinations'
  | 'allergies'
  | 'medications'
  | 'visits'
  | 'growth'
  | 'insurance';

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('vaccinations');

  const tabs = [
    { icon: Syringe, id: 'vaccinations' as Tab, label: 'Vaccinations' },
    { icon: AlertCircle, id: 'allergies' as Tab, label: 'Allergies' },
    { icon: Pill, id: 'medications' as Tab, label: 'Medications' },
    { icon: FileText, id: 'visits' as Tab, label: 'Doctor Visits' },
    { icon: TrendingUp, id: 'growth' as Tab, label: 'Growth Charts' },
    { icon: Shield, id: 'insurance' as Tab, label: 'Insurance' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-balance">Medical Records</h1>
            <p className="text-muted-foreground mt-1">
              Complete health history and medical information
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  className="flex items-center gap-2 whitespace-nowrap"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'vaccinations' && <VaccinationsTab />}
          {activeTab === 'allergies' && <AllergiesTab />}
          {activeTab === 'medications' && <MedicationsTab />}
          {activeTab === 'visits' && <DoctorVisitsTab />}
          {activeTab === 'growth' && <GrowthChartsTab />}
          {activeTab === 'insurance' && <InsuranceTab />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function VaccinationsTab() {
  const vaccinations = [
    {
      doses: [
        { date: '2024-01-15', number: 1, status: 'completed' },
        { date: '2024-02-15', number: 2, status: 'completed' },
        { date: '2024-07-15', number: 3, status: 'upcoming' },
      ],
      name: 'Hepatitis B',
    },
    {
      doses: [
        { date: '2024-03-15', number: 1, status: 'completed' },
        { date: '2024-05-15', number: 2, status: 'upcoming' },
        { date: '2024-07-15', number: 3, status: 'scheduled' },
      ],
      name: 'DTaP (Diphtheria, Tetanus, Pertussis)',
    },
    {
      doses: [
        { date: '2024-03-15', number: 1, status: 'completed' },
        { date: '2024-05-15', number: 2, status: 'upcoming' },
      ],
      name: 'Polio (IPV)',
    },
    {
      doses: [
        { date: '2024-03-15', number: 1, status: 'completed' },
        { date: '2024-05-15', number: 2, status: 'upcoming' },
      ],
      name: 'Pneumococcal (PCV13)',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">Next Vaccination Due</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hepatitis B (Dose 3) - July 15, 2024
            </p>
          </div>
        </div>
      </Card>

      {vaccinations.map((vaccine) => (
        <Card className="p-4" key={vaccine.name}>
          <h3 className="font-semibold mb-3">{vaccine.name}</h3>
          <div className="space-y-2">
            {vaccine.doses.map((dose) => (
              <div
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                key={dose.number}
              >
                <div className="flex items-center gap-3">
                  {dose.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : dose.status === 'upcoming' ? (
                    <Clock className="h-5 w-5 text-primary" />
                  ) : (
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Dose {dose.number}</p>
                    <p className="text-sm text-muted-foreground">{dose.date}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    dose.status === 'completed'
                      ? 'bg-green-500/10 text-green-500'
                      : dose.status === 'upcoming'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {dose.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Vaccination
      </Button>
    </div>
  );
}

function AllergiesTab() {
  const allergies = [
    {
      dateIdentified: '2024-02-10',
      name: 'Peanuts',
      reaction: 'Anaphylaxis',
      severity: 'Severe',
    },
    {
      dateIdentified: '2024-01-20',
      name: 'Penicillin',
      reaction: 'Rash, hives',
      severity: 'Moderate',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">
              Known Allergies: {allergies.length}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Always inform healthcare providers
            </p>
          </div>
        </div>
      </Card>

      {allergies.map((allergy) => (
        <Card className="p-4" key={allergy.name}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{allergy.name}</h3>
              <p className="text-sm text-muted-foreground">
                Identified: {allergy.dateIdentified}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                allergy.severity === 'Severe'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary/10 text-secondary'
              }`}
            >
              {allergy.severity}
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Reaction</Label>
              <p className="text-sm">{allergy.reaction}</p>
            </div>
          </div>
        </Card>
      ))}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Allergy
      </Button>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">No Known Allergies?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          If your baby has no known allergies, you can document that here for
          medical records.
        </p>
        <Button size="sm" variant="outline">
          Mark as No Known Allergies
        </Button>
      </Card>
    </div>
  );
}

function MedicationsTab() {
  const medications = [
    {
      dosage: '400 IU daily',
      frequency: 'Once daily',
      name: 'Vitamin D Drops',
      startDate: '2024-01-15',
      status: 'active',
    },
    {
      dosage: '5ml',
      endDate: '2024-02-27',
      frequency: 'Twice daily',
      name: 'Amoxicillin',
      startDate: '2024-02-20',
      status: 'completed',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Pill className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">
              Active Medications: 1
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set reminders for medication times
            </p>
          </div>
        </div>
      </Card>

      {medications.map((med) => (
        <Card className="p-4" key={med.name}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{med.name}</h3>
              <p className="text-sm text-muted-foreground">{med.dosage}</p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                med.status === 'active'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {med.status}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-medium">{med.frequency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{med.startDate}</span>
            </div>
            {med.endDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{med.endDate}</span>
              </div>
            )}
          </div>
        </Card>
      ))}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Medication
      </Button>
    </div>
  );
}

function DoctorVisitsTab() {
  const visits = [
    {
      date: '2024-03-15',
      doctor: 'Dr. Sarah Johnson',
      nextVisit: '2024-05-15',
      notes:
        '2-month checkup. Weight: 12 lbs, Height: 23 inches. All developmental milestones met. Received vaccinations.',
      type: 'Well-Baby Checkup',
    },
    {
      date: '2024-02-01',
      doctor: 'Dr. Sarah Johnson',
      notes:
        'Mild cold symptoms. Prescribed saline drops and humidifier. Follow up if symptoms worsen.',
      type: 'Sick Visit',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">Next Appointment</h3>
            <p className="text-sm text-muted-foreground mt-1">
              4-Month Checkup - May 15, 2024
            </p>
          </div>
        </div>
      </Card>

      {visits.map((visit) => (
        <Card className="p-4" key={`${visit.type}-${visit.date}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{visit.type}</h3>
              <p className="text-sm text-muted-foreground">{visit.date}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Doctor</Label>
              <p className="text-sm font-medium">{visit.doctor}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Visit Notes
              </Label>
              <p className="text-sm">{visit.notes}</p>
            </div>
            {visit.nextVisit && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Next Visit Scheduled
                </Label>
                <p className="text-sm font-medium">{visit.nextVisit}</p>
              </div>
            )}
          </div>
        </Card>
      ))}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Doctor Visit
      </Button>
    </div>
  );
}

function GrowthChartsTab() {
  const measurements = [
    {
      age: '2 months',
      date: '2024-03-15',
      headCirc: '15.5 in',
      height: '23 in',
      percentiles: { head: 60, height: 70, weight: 65 },
      weight: '12 lbs',
    },
    {
      age: 'Birth',
      date: '2024-01-15',
      headCirc: '13.5 in',
      height: '20 in',
      percentiles: { head: 50, height: 55, weight: 50 },
      weight: '7.5 lbs',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">Latest Measurements</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Weight: 12 lbs (65th percentile)
            </p>
          </div>
        </div>
      </Card>

      {measurements.map((measurement) => (
        <Card className="p-4" key={measurement.date}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{measurement.age}</h3>
              <p className="text-sm text-muted-foreground">
                {measurement.date}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <p className="text-lg font-semibold">{measurement.weight}</p>
              <p className="text-xs text-muted-foreground">
                {measurement.percentiles.weight}th percentile
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Height</Label>
              <p className="text-lg font-semibold">{measurement.height}</p>
              <p className="text-xs text-muted-foreground">
                {measurement.percentiles.height}th percentile
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Head</Label>
              <p className="text-lg font-semibold">{measurement.headCirc}</p>
              <p className="text-xs text-muted-foreground">
                {measurement.percentiles.head}th percentile
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Weight Percentile</span>
                <span className="font-medium">
                  {measurement.percentiles.weight}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${measurement.percentiles.weight}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Measurement
      </Button>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Growth Chart Standards</h3>
        <p className="text-sm text-muted-foreground">
          Percentiles are based on WHO growth standards. Consult your
          pediatrician if you have concerns about your baby's growth.
        </p>
      </Card>
    </div>
  );
}

function InsuranceTab() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Primary Insurance</h3>
        <div className="space-y-4">
          <div>
            <Label>Insurance Provider</Label>
            <Input
              className="mt-1"
              placeholder="e.g., Blue Cross Blue Shield"
            />
          </div>
          <div>
            <Label>Policy Number</Label>
            <Input className="mt-1" placeholder="Enter policy number" />
          </div>
          <div>
            <Label>Group Number</Label>
            <Input className="mt-1" placeholder="Enter group number" />
          </div>
          <div>
            <Label>Policyholder Name</Label>
            <Input className="mt-1" placeholder="Enter policyholder name" />
          </div>
          <div>
            <Label>Member ID</Label>
            <Input className="mt-1" placeholder="Enter member ID" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Secondary Insurance (Optional)</h3>
        <div className="space-y-4">
          <div>
            <Label>Insurance Provider</Label>
            <Input className="mt-1" placeholder="e.g., Aetna" />
          </div>
          <div>
            <Label>Policy Number</Label>
            <Input className="mt-1" placeholder="Enter policy number" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Insurance Card Photos</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Upload photos of your insurance cards for quick reference at
          appointments.
        </p>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Upload Card Photos
        </Button>
      </Card>

      <Button className="w-full">Save Insurance Information</Button>
    </div>
  );
}
