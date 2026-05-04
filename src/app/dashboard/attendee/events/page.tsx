'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Calendar, MapPin } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  startDate: string;
  venueName: string | null;
  registered: boolean;
}

export default function AttendeeEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/attendee/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      const res = await fetch('/api/attendee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        toast.success('Registered successfully!');
        fetchEvents(); // refresh
      } else {
        const json = await res.json();
        toast.error(json.error || 'Registration failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) return <div className="text-center py-10">Loading events...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Upcoming Events</h1>
      {events.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-400">No events available.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader><CardTitle className="text-white">{event.title}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
                {event.venueName && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venueName}</span>
                  </div>
                )}
                <Button
                  onClick={() => handleRegister(event.id)}
                  disabled={event.registered}
                  className="w-full mt-2"
                >
                  {event.registered ? 'Registered' : 'Register'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}