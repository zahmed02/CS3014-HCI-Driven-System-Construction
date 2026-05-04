'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface Event {
  id: number;
  title: string;
}

interface Proposal {
  id: number;
  eventId: number;
  eventTitle: string;
  proposalText: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  createdAt: string;
}

export default function VendorProposalsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, proposalsRes] = await Promise.all([
        fetch('/api/events/public'),
        fetch('/api/vendor/proposals'),
      ]);
      const eventsData = await eventsRes.json();
      const proposalsData = await proposalsRes.json();
      setEvents(eventsData.events || []);
      setProposals(proposalsData.proposals || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !proposalText.trim()) {
      toast.error('Please select an event and write a proposal');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: parseInt(selectedEvent),
          proposalText: proposalText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.proposalId) {
        const newProposalId = data.proposalId;
        // Add the new proposal to the local list optimistically (optional)
        // Refresh the list from server
        await fetchData();
        toast.success('Proposal submitted', {
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                const undoRes = await fetch(`/api/vendor/proposals/${newProposalId}`, {
                  method: 'DELETE',
                });
                if (undoRes.ok) {
                  toast.info('Proposal removed');
                  await fetchData(); // refresh again
                } else {
                  toast.error('Could not undo – proposal may already be processed');
                }
              } catch {
                toast.error('Undo failed');
              }
            },
          },
          duration: 10000, // 10 seconds to decide
        });
        setShowForm(false);
        setSelectedEvent('');
        setProposalText('');
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusDisplay = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.8)]" />
            <span className="text-green-400 font-bold drop-shadow-[0_0_2px_rgba(74,222,128,0.6)]">
              Approved
            </span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400">Pending</span>
          </div>
        );
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Proposals</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Proposal
        </Button>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-400">
            You haven't submitted any proposals yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((prop) => (
            <Card key={prop.id}>
              <CardHeader>
                <CardTitle className="text-white">{prop.eventTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  <span className="font-semibold text-gray-300">Proposal:</span> {prop.proposalText}
                </p>
                <div className="flex items-center gap-2">{statusDisplay(prop.status)}</div>
                {prop.comments && (
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Organizer comment:</span> {prop.comments}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Submitted: {new Date(prop.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for new proposal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Submit Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Select Event
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    required
                  >
                    <option value="" className="text-gray-400">Choose an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id.toString()}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Proposal Details
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    placeholder="Describe your services, pricing, etc."
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}