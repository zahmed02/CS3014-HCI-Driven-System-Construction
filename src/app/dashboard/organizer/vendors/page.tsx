'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface VendorRequest {
  id: number;
  eventId: number;
  eventTitle: string;
  vendorName: string;
  proposal: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/organizer/vendors');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch {
      toast.error('Failed to load vendor requests');
    } finally {
      setLoading(false);
    }
  };

const updateStatus = async (id: number, newStatus: 'approved' | 'rejected', comments?: string) => {
  const previousStatus = vendors.find(v => v.id === id)?.status;
  setActionLoading(id);
  try {
    const res = await fetch('/api/organizer/vendors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: id, status: newStatus, comments }),
    });
    if (res.ok) {
      // Update local state immediately
      setVendors(vendors.map(v => (v.id === id ? { ...v, status: newStatus } : v)));
      // Show toast with Undo button
      toast.success(`Proposal ${newStatus}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            // Revert to previous status
            await fetch('/api/organizer/vendors', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ registrationId: id, status: previousStatus, comments: null }),
            });
            setVendors(vendors.map(v => (v.id === id ? { ...v, status: previousStatus! } : v)));
            toast.info('Change undone');
          },
        },
        duration: 10000, // 10 seconds to undo
      });
    } else {
      toast.error('Update failed');
    }
  } catch {
    toast.error('Network error');
  } finally {
    setActionLoading(null);
  }
};

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Vendor Registrations</h1>
      {vendors.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-400">No vendor requests.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {vendors.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-white">{v.eventTitle} – {v.vendorName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-300">
                  <strong>Proposal:</strong> {v.proposal || 'No proposal text provided'}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted: {v.createdAt ? new Date(v.createdAt).toLocaleString() : 'Unknown'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {v.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(v.id, 'approved')} disabled={actionLoading === v.id}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'rejected')} disabled={actionLoading === v.id}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {v.status === 'approved' && <span className="text-green-400 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Approved</span>}
                  {v.status === 'rejected' && <span className="text-red-400 flex items-center"><XCircle className="h-4 w-4 mr-1" /> Rejected</span>}
                  {v.status === 'pending' && <span className="text-yellow-400 flex items-center"><Clock className="h-4 w-4 mr-1" /> Pending</span>}
                </div>
                {v.comments && <p className="text-sm text-gray-400 mt-2">Comments: {v.comments}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}