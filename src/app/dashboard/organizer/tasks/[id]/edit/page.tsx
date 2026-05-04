'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: number;
  title: string;
}

interface Staff {
  id: number;
  name: string;
}

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    status: 'pending',
    eventId: '',
    assignedTo: '',
  });

  useEffect(() => {
    Promise.all([fetchTask(), fetchEvents(), fetchStaff()]);
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const task = data.task;
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        deadline: task.deadline ? task.deadline.slice(0, 16) : '',
        status: task.status || 'pending',
        eventId: task.eventId?.toString() || '',
        assignedTo: task.assignedTo?.toString() || '',
      });
    } catch {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      let eventsList = data.events || [];
      // Normalise event_id → id
      if (eventsList.length > 0 && eventsList[0].event_id !== undefined && eventsList[0].id === undefined) {
        eventsList = eventsList.map((ev: any) => ({ id: ev.event_id, title: ev.title }));
      }
      setEvents(eventsList);
    } catch {
      toast.error('Failed to load events');
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/users/staff');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      toast.error('Failed to load staff');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventIdNum = parseInt(form.eventId);
    if (!form.title.trim() || isNaN(eventIdNum)) {
      toast.error('Title and event are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority,
          deadline: form.deadline || null,
          status: form.status,
          eventId: eventIdNum,
          assignedTo: form.assignedTo ? parseInt(form.assignedTo) : null,
        }),
      });
      if (res.ok) {
        toast.success('Task updated');
        router.push('/dashboard/organizer/tasks');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Update failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

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
          <label className="block text-sm font-medium text-gray-300">Priority</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Deadline</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Status</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Event *</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            required
          >
            <option value="">Select event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id.toString()}>{e.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Assign to Staff</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id.toString()}>{s.name}</option>
            ))}
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