'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  startDate: string;
  feedbackGiven: boolean;
  rating?: number;
  comment?: string;
}

export default function AttendeeFeedbackPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventsWithFeedback();
  }, []);

  const fetchEventsWithFeedback = async () => {
    try {
      const res = await fetch('/api/attendee/events-with-feedback');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          rating,
          comment,
        }),
      });
      if (res.ok) {
        toast.success('Thank you for your feedback!');
        setSelectedEvent(null);
        setRating(5);
        setComment('');
        fetchEventsWithFeedback(); // refresh list
      } else {
        const err = await res.json();
        toast.error(err.error || 'Submission failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading events...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Submit Feedback</h1>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-400">
            No events found. Register for events first to leave feedback.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="relative">
              <CardHeader>
                <CardTitle className="text-white">{event.title}</CardTitle>
                <p className="text-sm text-gray-400">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {event.feedbackGiven ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (event.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    {event.comment && <p className="text-gray-400 text-sm">{event.comment}</p>}
                    <p className="text-xs text-green-400">Feedback already given</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedEvent(event)}
                    variant="outline"
                    className="w-full"
                  >
                    Give Feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for feedback form */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Feedback for {selectedEvent.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Comment (optional)
                </label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}