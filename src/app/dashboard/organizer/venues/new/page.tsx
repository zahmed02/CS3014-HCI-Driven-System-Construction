'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', capacity: '', amenities: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null }),
      });
      if (res.ok) {
        toast.success('Venue created');
        router.push('/dashboard/organizer/venues');
      } else {
        toast.error('Creation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-300">Name *</label><input className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div><label className="block text-sm font-medium text-gray-300">Address</label><input className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        <div><label className="block text-sm font-medium text-gray-300">Capacity</label><input type="number" className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
        <div><label className="block text-sm font-medium text-gray-300">Amenities</label><input className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} /></div>
        <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Venue'} <Save className="ml-2 h-4 w-4" /></Button></div>
      </form>
    </div>
  );
}