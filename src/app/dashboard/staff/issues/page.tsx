'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function StaffIssuesPage() {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Please describe the issue');
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        toast.success('Issue reported successfully');
        setDescription('');
      } else {
        toast.error('Failed to report issue');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
      <Card>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Describe the problem</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={5}
              className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white"
              placeholder="What went wrong? Include details like event name, time, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Issue'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}