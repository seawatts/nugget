'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Input } from '@nugget/ui/input';
import { cn } from '@nugget/ui/lib/utils';
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
}

const inviteOptions: InviteOption[] = [
  {
    color: 'bg-accent/20 text-accent',
    description: 'Full access to track and manage baby care together',
    icon: Heart,
    title: 'Partner',
    type: 'partner',
  },
  {
    color: 'bg-secondary/20 text-secondary',
    description: 'Access to daily routines and care schedules',
    icon: Users,
    title: 'Caregiver / Babysitter',
    type: 'caregiver',
  },
  {
    color: 'bg-primary/20 text-primary',
    description: 'View milestones, photos, and updates',
    icon: Baby,
    title: 'Family & Friends',
    type: 'family',
  },
  {
    color: 'bg-chart-4/20 text-chart-4',
    description: 'Access to medical records and health data',
    icon: Stethoscope,
    title: 'Healthcare Provider',
    type: 'doctor',
  },
];

export function InviteCaregiversStep() {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance">Invite Caregivers</h1>
        <p className="text-muted-foreground text-balance">
          Share your baby's journey with others (optional)
        </p>
      </div>

      {!selectedType ? (
        <div className="space-y-3">
          {inviteOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                className={cn(
                  'w-full p-6 rounded-3xl border-2 transition-all text-left',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'border-border bg-card hover:border-primary/50',
                )}
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                type="button"
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
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Type Header */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${selectedOption?.color}`}>
                {selectedOption && <selectedOption.icon className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {selectedOption?.title}
                </h3>
                <p className="text-sm text-muted-foreground text-balance">
                  {selectedOption?.description}
                </p>
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
                    Send Invite
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
                Generate Link
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
  );
}
