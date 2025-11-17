'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@nugget/ui/button';
import { Label } from '@nugget/ui/label';
import {
  Calendar,
  ChevronRight,
  LogOut,
  Mail,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { useState } from 'react';
import { SignOutButton } from '~/components/sign-out-button';
import { DeleteAccountDialog } from '../_components/delete-account-dialog';

export default function AccountSettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  if (!userLoaded) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">
            Loading account information...
          </p>
        </div>
      </div>
    );
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  const externalAccounts = user?.externalAccounts || [];
  const connectedProviders = externalAccounts.map((account) => ({
    id: account.id,
    provider: account.provider,
    username: account.username || account.emailAddress,
  }));

  return (
    <div className="space-y-4">
      {/* Account Information */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Account Information</h2>
          <p className="text-sm text-muted-foreground">
            Your account details and settings
          </p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium">Email Address</Label>
              <p className="text-sm text-muted-foreground break-all">
                {primaryEmail || 'No email address'}
              </p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">{createdAt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {connectedProviders.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Accounts you've connected to sign in
            </p>
          </div>

          <div className="space-y-2">
            {connectedProviders.map((account) => (
              <div
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                key={account.id}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {account.provider}
                  </p>
                  {account.username && (
                    <p className="text-xs text-muted-foreground">
                      {account.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Session</h2>
          <p className="text-sm text-muted-foreground">
            Sign out of your account
          </p>
        </div>

        <SignOutButton>
          <Button className="w-full" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>

      {/* Privacy & Data */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Privacy & Data</h2>
          <p className="text-sm text-muted-foreground">
            Control your data and privacy
          </p>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-muted-foreground">
                Read our privacy policy
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Terms of Service</p>
              <p className="text-sm text-muted-foreground">
                Read our terms of service
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Data Usage</p>
              <p className="text-sm text-muted-foreground">
                Learn how we use your data
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <UserCircle className="size-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and ALL data including all baby
              profiles, activities, and settings. This action is final and
              cannot be undone.
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => setShowDeleteAccountDialog(true)}
          variant="destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete Account Permanently
        </Button>
      </div>

      {/* Delete Account Dialog */}
      {user && (
        <DeleteAccountDialog
          isOpen={showDeleteAccountDialog}
          onClose={() => setShowDeleteAccountDialog(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}
