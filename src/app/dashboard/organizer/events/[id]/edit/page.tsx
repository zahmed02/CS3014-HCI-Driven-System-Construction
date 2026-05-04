'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venueId: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load event');
      }
      const data = await res.json();
      const event = data.event;
      if (!event) throw new Error('No event data');

      // Format ISO date to datetime-local input format
      const formatDateForInput = (isoString: string) => {
        if (!isoString) return '';
        return isoString.slice(0, 16);
      };

      setForm({
        title: event.title || '',
        description: event.description || '',
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        venueId: event.venueId?.toString() || '',
        status: event.status || 'draft',
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast.error('Title, start date and end date are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          venueId: form.venueId ? parseInt(form.venueId) : null,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Event updated successfully');
        router.push(`/dashboard/organizer/events/${eventId}`);
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading event data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Title *</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Description</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Start Date *</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">End Date *</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Venue ID (Optional)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.venueId}
            onChange={(e) => setForm({ ...form, venueId: e.target.value })}
            placeholder="Enter venue ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Status</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Draft (only visible to organizers)</option>
            <option value="published">Published (visible to vendors & attendees)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'} <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}