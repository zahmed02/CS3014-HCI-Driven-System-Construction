'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import Link from 'next/link';

interface Proposal {
  id: number;
  eventTitle: string;
  status: string;
  createdAt: string;
}

export default function VendorDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/vendor/proposals');
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const approvedCount = proposals.filter(p => p.status === 'approved').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

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
        <h1 className="text-2xl font-bold text-white">Vendor Dashboard</h1>
        <Link href="/dashboard/vendor/proposals/new">
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Proposal
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          trend="awaiting review"
          color="yellow"
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={CheckCircle}
          trend="accepted"
          color="green"
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={XCircle}
          trend="not selected"
          color="red"
        />
      </div>

      {/* Recent Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center text-gray-400 py-6">You haven't submitted any proposals yet.</div>
          ) : (
            <div className="space-y-3">
              {proposals.slice(0, 5).map((prop) => (
                <div key={prop.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div>
                    <p className="text-white">{prop.eventTitle}</p>
                    <p className="text-xs text-gray-400">Submitted: {new Date(prop.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    prop.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                    prop.status === 'approved' ? 'bg-green-900/50 text-green-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {prop.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link href="/dashboard/vendor/proposals" className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]">
              View all proposals →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorClasses = {
    yellow: 'bg-yellow-900/30 text-yellow-400',
    green: 'bg-green-900/30 text-green-400',
    red: 'bg-red-900/30 text-red-400',
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