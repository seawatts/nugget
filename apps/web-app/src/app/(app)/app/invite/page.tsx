'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Input } from '@nugget/ui/input';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Check,
  Copy,
  Heart,
  Link2,
  Mail,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useState } from 'react';

type InviteType = 'partner' | 'caregiver' | 'family' | 'doctor';

interface InviteOption {
  type: InviteType;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  permissions: string[];
}

const inviteOptions: InviteOption[] = [
  {
    color: 'bg-accent/20 text-accent',
    description: "Full access to track and manage baby's care together",
    icon: Heart,
    permissions: [
      'View all data',
      'Add entries',
      'Edit settings',
      'Manage budget',
    ],
    title: 'Partner',
    type: 'partner',
  },
  {
    color: 'bg-secondary/20 text-secondary',
    description: 'Access to daily routines, schedules, and emergency contacts',
    icon: Users,
    permissions: [
      'View schedules',
      'View caregiver guide',
      'Emergency contacts',
      'Add basic entries',
    ],
    title: 'Caregiver / Babysitter',
    type: 'caregiver',
  },
  {
    color: 'bg-primary/20 text-primary',
    description: 'View-only access to milestones, photos, and updates',
    icon: Baby,
    permissions: [
      'View milestones',
      'View photos',
      'View growth charts',
      'Read-only access',
    ],
    title: 'Family & Friends',
    type: 'family',
  },
  {
    color: 'bg-chart-4/20 text-chart-4',
    description: 'Access to medical records, growth charts, and health data',
    icon: Stethoscope,
    permissions: [
      'View medical records',
      'View growth data',
      'View vaccination records',
      'Read-only access',
    ],
    title: 'Healthcare Provider',
    type: 'doctor',
  },
];

export default function InvitePage() {
  const [selectedType, setSelectedType] = useState<InviteType | null>(null);
  const [email, setEmail] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const selectedOption = inviteOptions.find((opt) => opt.type === selectedType);

  const generateInviteLink = () => {
    // Generate a unique invite link (in production, this would be a real API call)
    const uniqueId = Math.random().toString(36).substring(7);
    const link = `${window.location.origin}/accept-invite?type=${selectedType}&id=${uniqueId}`;
    setInviteLink(link);
    setShowLink(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailInvite = () => {
    // In production, this would send an actual email
    console.log(`Sending invite to ${email} as ${selectedType}`);
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setEmail('');
    }, 3000);
  };

  return (
    <main className="px-6 pt-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balance">Invite Others</h1>
          <p className="text-muted-foreground text-balance">
            Share your baby's journey with family, caregivers, and healthcare
            providers
          </p>
        </div>

        {/* Invite Type Selection */}
        {!selectedType ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Who would you like to invite?
            </h2>
            <div className="grid gap-4">
              {inviteOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    className="p-6 cursor-pointer hover:border-primary transition-all"
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${option.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{option.title}</h3>
                        <p className="text-sm text-muted-foreground text-balance">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Type Header */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${selectedOption?.color}`}>
                  {selectedOption && (
                    <selectedOption.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedOption?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground text-balance">
                      {selectedOption?.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Access Permissions:</p>
                    <ul className="space-y-1">
                      {selectedOption?.permissions.map((permission) => (
                        <li
                          className="text-sm text-muted-foreground flex items-center gap-2"
                          key={permission}
                        >
                          <Check className="h-4 w-4 text-primary" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Email Invite */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Send Email Invite</h3>
              </div>
              <div className="space-y-3">
                <Input
                  className="h-12"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                  value={email}
                />
                <Button
                  className="w-full h-12"
                  disabled={!email || emailSent}
                  onClick={sendEmailInvite}
                  size="lg"
                >
                  {emailSent ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Invite Sent!
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Email Invite
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Share Link */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/20">
                  <Link2 className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-semibold">Share Invite Link</h3>
              </div>
              {!showLink ? (
                <Button
                  className="w-full h-12 bg-transparent"
                  onClick={generateInviteLink}
                  size="lg"
                  variant="outline"
                >
                  <Link2 className="h-5 w-5 mr-2" />
                  Generate Shareable Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-xl break-all text-sm font-mono">
                    {inviteLink}
                  </div>
                  <Button
                    className="w-full h-12 bg-transparent"
                    onClick={copyToClipboard}
                    size="lg"
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Back Button */}
            <Button
              className="w-full"
              onClick={() => {
                setSelectedType(null);
                setShowLink(false);
                setEmail('');
              }}
              variant="ghost"
            >
              Choose Different Type
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
