'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckSquare, AlertCircle, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';
import Link from 'next/link';

interface Task {
  id: number;
  title: string;
  status: string;
  deadline: string | null;
}

interface Issue {
  id: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchIssues()]).finally(() => setLoading(false));
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/staff/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/staff/issues');
      const data = await res.json();
      setIssues(data.issues || []);
    } catch {
      toast.error('Failed to load issues');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const openIssues = issues.filter(i => i.status === 'open');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          icon={Clock}
          trend="awaiting start"
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks.length}
          icon={Loader2}
          trend="active"
          color="blue"
        />
        <StatCard
          title="Completed"
          value={completedTasks.length}
          icon={CheckCircle}
          trend="finished"
          color="green"
        />
        <StatCard
          title="Open Issues"
          value={openIssues.length}
          icon={AlertCircle}
          trend="need attention"
          color="red"
        />
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No tasks assigned yet.</div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div>
                    <p className="text-white">{task.title}</p>
                    {task.deadline && (
                      <p className="text-xs text-gray-400">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                    task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-green-900/50 text-green-300'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
<Link 
  href="/dashboard/staff/tasks" 
  className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]"
>
  View all tasks →
</Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Recent Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No issues reported.</div>
          ) : (
            <div className="space-y-3">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <p className="text-white truncate max-w-md">{issue.description}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    issue.status === 'open' ? 'bg-red-900/50 text-red-300' :
                    issue.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-green-900/50 text-green-300'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
<Link 
  href="/dashboard/staff/issues" 
  className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]"
>
  Report new issue →
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
    blue: 'bg-blue-900/30 text-blue-400',
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