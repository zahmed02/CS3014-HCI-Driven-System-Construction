'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';

interface EventDetail {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venueId: number | null;
  venueName: string | null;
  status: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvent(data.event);
    } catch {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!event) return <div className="text-center py-10 text-red-400">Event not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span>
              {new Date(event.startDate).toLocaleString()} – {new Date(event.endDate).toLocaleString()}
            </span>
          </div>
          {event.venueName && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-5 w-5 text-blue-400" />
              <span>{event.venueName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-300">
            <FileText className="h-5 w-5 text-blue-400" />
            <span>Status: <span className="capitalize">{event.status}</span></span>
          </div>
          {event.description && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              <p className="text-white whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}