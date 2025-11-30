import { Card } from '@nugget/ui/card';
import { Sparkles } from 'lucide-react';

interface EncouragementMessageProps {
  message: string;
}

export function EncouragementMessage({ message }: EncouragementMessageProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </Card>
  );
}
