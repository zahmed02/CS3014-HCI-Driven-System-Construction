'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Star, CheckCircle, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import Link from 'next/link';

interface RegisteredEvent {
  id: number;
  title: string;
  startDate: string;
  feedbackGiven: boolean;
}

export default function AttendeeDashboard() {
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
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

  const registeredCount = events.length;
  const feedbackGivenCount = events.filter(e => e.feedbackGiven).length;
  const feedbackPendingCount = registeredCount - feedbackGivenCount;
  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).slice(0, 3);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Attendee Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          title="Registered Events"
          value={registeredCount}
          icon={Calendar}
          trend="total"
          color="blue"
        />
        <StatCard
          title="Feedback Given"
          value={feedbackGivenCount}
          icon={Star}
          trend="thank you!"
          color="green"
        />
        <StatCard
          title="Pending Feedback"
          value={feedbackPendingCount}
          icon={Clock}
          trend="don't forget"
          color="yellow"
        />
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Your Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No upcoming events. Register for events to see them here.</div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div>
                    <p className="text-white">{event.title}</p>
                    <p className="text-xs text-gray-400">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  {event.feedbackGiven ? (
                    <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Feedback given</span>
                  ) : (
                    <Link href={`/dashboard/attendee/feedback`} className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]">
                      Give feedback →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link href="/dashboard/attendee/events" className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]">
              Browse more events →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-900/30 text-blue-400',
    green: 'bg-green-900/30 text-green-400',
    yellow: 'bg-yellow-900/30 text-yellow-400',
  };
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{trend}</p>
          </div>
          <div className={`rounded-full p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}