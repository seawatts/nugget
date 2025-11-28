'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { toast } from '@nugget/ui/sonner';
import { Moon, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatCompactRelativeTime } from '../activities/shared/utils/format-compact-relative-time';
import {
  getParentSleepDataAction,
  type ParentSleepData,
  quickLogParentSleepAction,
} from './parent-sleep/actions';

interface ParentSleepCardProps {
  userId: string;
  onSleepLogged?: () => void;
}

export function ParentSleepCard({
  userId,
  onSleepLogged,
}: ParentSleepCardProps) {
  const [data, setData] = useState<ParentSleepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [durationHours, setDurationHours] = useState('7');
  const [logging, setLogging] = useState(false);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getParentSleepDataAction({ userId });
      if (result?.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load parent sleep data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickLog = async () => {
    try {
      setLogging(true);
      const hours = Number.parseFloat(durationHours);
      if (Number.isNaN(hours) || hours <= 0 || hours > 24) {
        toast.error('Please enter a valid duration between 0.5 and 24 hours');
        return;
      }

      const result = await quickLogParentSleepAction({
        durationHours: hours,
        userId,
      });

      if (result?.data) {
        toast.success('Sleep logged successfully');
        setShowLogDrawer(false);
        await loadData();
        onSleepLogged?.();
      }
    } catch (error) {
      console.error('Failed to log sleep:', error);
      toast.error('Failed to log sleep');
    } finally {
      setLogging(false);
    }
  };

  const totalSleepHours = data?.totalSleepLast24h
    ? (data.totalSleepLast24h / 3600).toFixed(1)
    : '0';

  const logSleepForm = (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="duration">Sleep Duration (hours)</Label>
          <Input
            id="duration"
            max="24"
            min="0.5"
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="7"
            step="0.5"
            type="number"
            value={durationHours}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      <Card
        className="p-4 cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setShowLogDrawer(true)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Moon className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">Your Sleep</p>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <>
                  {data?.lastSleep ? (
                    <p className="text-sm text-muted-foreground">
                      Last:{' '}
                      {formatCompactRelativeTime(data.lastSleep.startTime, {
                        addSuffix: true,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent sleep logged
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {totalSleepHours}h in last 24h
                  </p>
                </>
              )}
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogDrawer(true);
            }}
            size="sm"
            variant="ghost"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </Card>

      {isDesktop ? (
        <Dialog onOpenChange={setShowLogDrawer} open={showLogDrawer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Your Sleep</DialogTitle>
              <DialogDescription>
                Track your sleep to monitor your rest and recovery
              </DialogDescription>
            </DialogHeader>
            {logSleepForm}
            <DialogFooter>
              <Button onClick={() => setShowLogDrawer(false)} variant="outline">
                Cancel
              </Button>
              <Button disabled={logging} onClick={handleQuickLog}>
                {logging ? 'Logging...' : 'Log Sleep'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer onOpenChange={setShowLogDrawer} open={showLogDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Log Your Sleep</DrawerTitle>
              <DrawerDescription>
                Track your sleep to monitor your rest and recovery
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">{logSleepForm}</div>
            <DrawerFooter>
              <Button disabled={logging} onClick={handleQuickLog}>
                {logging ? 'Logging...' : 'Log Sleep'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
