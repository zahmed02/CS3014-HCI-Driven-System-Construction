'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, MapPin, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

interface Venue {
  id: number;
  name: string;
  address: string;
  capacity: number;
  amenities: string;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetchVenues(); }, []);

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVenues(data.venues || []);
    } catch {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/venues/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Venue deleted');
        setVenues(venues.filter(v => v.id !== deleteId));
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="text-center py-10">Loading venues...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Venues</h1>
        <Link href="/dashboard/organizer/venues/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Add Venue</Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-400">No venues yet. Add your first venue.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Card key={venue.id} className="hover:border-gray-600 transition-colors">
              <CardHeader><CardTitle className="text-white">{venue.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {venue.address && <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {venue.address}</p>}
                {venue.capacity && <p className="text-sm text-gray-400 flex items-center gap-1"><Users className="h-3 w-3" /> Capacity: {venue.capacity}</p>}
                {venue.amenities && <p className="text-sm text-gray-400 flex items-center gap-1"><Wrench className="h-3 w-3" /> {venue.amenities}</p>}
                <div className="flex justify-end gap-2 mt-4">
                  <Link href={`/dashboard/organizer/venues/${venue.id}/edit`}>
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(venue.id)} className="text-red-400"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)} title="Delete Venue" description="This action cannot be undone." onConfirm={handleDelete} confirmText="Delete" />
    </div>
  );
}