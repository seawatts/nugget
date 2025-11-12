import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { AlertTriangle, Mail, Settings } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/baby/placeholder.svg?height=48&width=48" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            RW
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-lg">Riley W...</span>
      </div>

      <div className="flex items-center gap-1">
        <Link href="/emergency">
          <Button
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            size="icon"
            variant="ghost"
          >
            <AlertTriangle className="h-6 w-6" />
          </Button>
        </Link>
        <Button className="text-muted-foreground" size="icon" variant="ghost">
          <Mail className="h-6 w-6" />
        </Button>
        <Link href="/settings">
          <Button className="text-muted-foreground" size="icon" variant="ghost">
            <Settings className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
