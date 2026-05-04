'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Plus, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Spinner';
import { Tooltip } from '@/components/ui/Tooltip'; // optional, for extra interactivity

interface Event {
  event_id: number;
  title: string;
  start_date: string;
  status: string;
}

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

const handleDelete = async () => {
  if (!deleteId) return;
  const deletedEvent = events.find(e => e.event_id === deleteId);
  try {
    const res = await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchEvents(); // refresh list
      toast.success('Event deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            // Restore event via POST with original data
            const restoreRes = await fetch('/api/events/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deletedEvent),
            });
            if (restoreRes.ok) {
              await fetchEvents();
              toast.info('Event restored');
            } else {
              toast.error('Restore failed');
            }
          },
        },
        duration: 15000,
      });
    } else {
      toast.error('Delete failed');
    }
  } catch {
    toast.error('Network error');
  } finally {
    setDeleteId(null);
  }
};

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">All Events</h1>
        <Link href="/dashboard/organizer/events/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-400">
            No events yet. Click "Create Event" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.event_id}
              className="card-accent hover:border-gray-600 transition-all duration-200 hover:scale-[1.02]"
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {event.status === 'published' ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" /> Published
                    </span>
                  ) : event.status === 'cancelled' ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="h-4 w-4" /> Cancelled
                    </span>
                  ) : (
                    <span className="text-yellow-400">Draft</span>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Link href={`/dashboard/organizer/events/${event.event_id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/organizer/events/${event.event_id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Tooltip content="Delete this event permanently">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(event.event_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Event"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
      />
    </div>
  );
}