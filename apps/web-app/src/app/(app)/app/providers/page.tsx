import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  Stethoscope,
} from 'lucide-react';

export default function ProvidersPage() {
  const providerTypes = [
    { color: 'bg-blue-500', count: 12, id: 'obgyn', title: 'OB-GYN' },
    {
      color: 'bg-green-500',
      count: 8,
      id: 'pediatrician',
      title: 'Pediatrician',
    },
    { color: 'bg-purple-500', count: 5, id: 'midwife', title: 'Midwife' },
    {
      color: 'bg-pink-500',
      count: 6,
      id: 'lactation',
      title: 'Lactation Consultant',
    },
  ];

  const providers = [
    {
      accepting: true,
      distance: '2.3 miles',
      id: 1,
      image: '/female-doctor.png',
      name: 'Dr. Sarah Johnson',
      nextAvailable: 'Tomorrow',
      rating: 4.9,
      reviews: 234,
      specialty: 'OB-GYN',
    },
    {
      accepting: true,
      distance: '3.1 miles',
      id: 2,
      image: '/male-doctor.png',
      name: 'Dr. Michael Chen',
      nextAvailable: 'This Week',
      rating: 4.8,
      reviews: 189,
      specialty: 'Pediatrician',
    },
    {
      accepting: false,
      distance: '1.8 miles',
      id: 3,
      image: '/female-nurse.png',
      name: 'Emily Rodriguez, CNM',
      nextAvailable: 'Next Week',
      rating: 5.0,
      reviews: 156,
      specialty: 'Certified Nurse Midwife',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-balance">
                Healthcare Providers
              </h1>
              <p className="text-muted-foreground">
                Find trusted care for you and your baby
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by name, specialty, or location..."
              type="text"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Provider Types */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Browse by Specialty</h2>
          <div className="grid grid-cols-2 gap-3">
            {providerTypes.map((type) => (
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                key={type.id}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center`}
                    >
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{type.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.count} nearby
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Nearby Providers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Nearby Providers</h2>
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {providers.map((provider) => (
              <Card className="overflow-hidden" key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="w-16 h-16 border-2 border-border">
                      <AvatarImage
                        alt={provider.name}
                        src={provider.image || '/placeholder.svg'}
                      />
                      <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {provider.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {provider.specialty}
                          </p>
                        </div>
                        {provider.accepting ? (
                          <Badge className="text-xs" variant="secondary">
                            Accepting
                          </Badge>
                        ) : (
                          <Badge className="text-xs" variant="outline">
                            Waitlist
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">
                            {provider.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({provider.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {provider.distance}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Next: {provider.nextAvailable}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="h-8 px-3 bg-transparent"
                            size="sm"
                            variant="outline"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button className="h-8 px-3" size="sm">
                            Book
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  View Your Appointments
                </CardTitle>
                <CardDescription>Manage your upcoming visits</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Request a Callback
                </CardTitle>
                <CardDescription>Get in touch with a provider</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
