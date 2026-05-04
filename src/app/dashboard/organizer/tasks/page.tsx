'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Flag, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import Link from 'next/link';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  deadline: string | null;
  status: string;
  eventId: number;
  eventTitle: string;
  assignedTo: number | null;
  assigneeName: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Task deleted');
        setTasks(tasks.filter(t => t.id !== deleteId));
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleteId(null);
    }
  };

  const priorityColor = (p: string) => {
    if (p === 'high') return 'text-red-400';
    if (p === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) return <div className="text-center py-10">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Staff Tasks</h1>
        <Link href="/dashboard/organizer/tasks/new"><Button><Plus className="h-4 w-4 mr-2" /> Create Task</Button></Link>
      </div>
      {tasks.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-400">No tasks yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader><CardTitle className="text-white">{task.title}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-300">{task.description || 'No description'}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${priorityColor(task.priority)}`}><Flag className="h-3 w-3" /> Priority: {task.priority}</span>
                  {task.deadline && <span className="flex items-center gap-1 text-gray-400"><Calendar className="h-3 w-3" /> Due: {new Date(task.deadline).toLocaleString()}</span>}
                  <span className="flex items-center gap-1 text-gray-400">{task.eventTitle}</span>
                  {task.assigneeName && <span className="flex items-center gap-1 text-gray-400"><User className="h-3 w-3" /> Assigned to: {task.assigneeName}</span>}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Link href={`/dashboard/organizer/tasks/${task.id}/edit`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button></Link>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(task.id)} className="text-red-400"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)} title="Delete Task" description="This action cannot be undone." onConfirm={handleDelete} confirmText="Delete" />
    </div>
  );
}