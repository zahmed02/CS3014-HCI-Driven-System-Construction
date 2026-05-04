"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface DashboardStats {
  totalEvents: number;
  pendingVendors: number;
  activeTasks: number;
  totalAttendees: number;
}

interface RecentEvent {
  event_id: number;
  title: string;
  start_date: string;
  status: string;
}

export default function OrganizerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    pendingVendors: 0,
    activeTasks: 0,
    totalAttendees: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/organizer/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
      } catch (error) {
        console.error(error);
        toast.error("Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
        <Link href="/dashboard/organizer/events/create">
          <Button>+ Create Event</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          trend="all time"
        />
        <StatCard
          title="Pending Vendors"
          value={stats.pendingVendors}
          icon={Users}
          trend="awaiting approval"
        />
        <StatCard
          title="Active Tasks"
          value={stats.activeTasks}
          icon={CheckSquare}
          trend="not completed"
        />
        <StatCard
          title="Attendees"
          value={stats.totalAttendees}
          icon={MapPin}
          trend="registered"
        />
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-800 text-sm text-gray-400">
                <tr>
                  <th className="pb-3 font-medium">Event Name</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.event_id} className="border-b border-gray-800">
                    <td className="py-3 font-medium text-white">
                      {event.title}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(event.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          event.status === "published"
                            ? "bg-green-900/50 text-green-300"
                            : event.status === "draft"
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/dashboard/organizer/events/${event.event_id}`}
                        className="text-blue-400 transition-colors hover:text-blue-300"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No events yet. Create your first event!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: number;
  icon: any;
  trend: string;
}) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{trend}</p>
          </div>
          <div className="rounded-full bg-blue-900/30 p-3 text-blue-400">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
