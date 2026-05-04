'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Calendar, Flag, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  deadline: string | null;
  status: string;
  eventTitle: string;
}

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/staff/tasks');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

const updateTaskStatus = async (taskId: number, newStatus: string) => {
  const previousStatus = tasks.find(t => t.id === taskId)?.status;
  setUpdating(taskId);
  try {
    const res = await fetch(`/api/staff/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            await fetch(`/api/staff/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: previousStatus }),
            });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: previousStatus! } : t));
            toast.info('Task status reverted');
          },
        },
        duration: 8000,
      });
    } else {
      toast.error('Update failed');
    }
  } catch {
    toast.error('Network error');
  } finally {
    setUpdating(null);
  }
};

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-400 font-bold hover:text-green-300 hover:underline transition drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Tasks</h1>
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-400">
            No tasks assigned yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="card-accent">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{task.title}</span>
                  <span className={`text-sm font-normal flex items-center gap-1 ${priorityColor(task.priority)}`}>
                    <Flag className="h-3 w-3" /> {task.priority}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-300">{task.description || 'No description'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(task.deadline).toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    Event: {task.eventTitle}
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(task.status)}
                    Status: {task.status.replace('_', ' ')}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      disabled={updating === task.id}
                    >
                      {updating === task.id ? <Spinner size={16} className="mr-1" /> : null}
                      Start Task
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      disabled={updating === task.id}
                    >
                      {updating === task.id ? <Spinner size={16} className="mr-1" /> : null}
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}