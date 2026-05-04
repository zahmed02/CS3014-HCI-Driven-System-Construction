'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { Calendar, MapPin, FileText, ChevronLeft, ChevronRight, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  venueId: z.string().optional(),
  status: z.enum(['draft', 'published']),
});

type EventForm = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      venueId: '',
      status: 'draft',
    },
  });

  // Auto-save draft to localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('eventDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      Object.keys(draft).forEach((key) => {
        setValue(key as keyof EventForm, draft[key]);
      });
      toast.info('Restored unsaved draft', { duration: 3000 });
    }
  }, [setValue]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('eventDraft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Clear draft after successful submission
  const clearDraft = () => {
    localStorage.removeItem('eventDraft');
  };

  // Keyboard shortcuts
  useHotkeys('ctrl+n', () => setStep(1));
  useHotkeys('ctrl+s', () => {
    if (step === 3) setShowConfirm(true);
    else handleNext();
  });
  useHotkeys('escape', () => router.back());

  const handleNext = async () => {
    const fieldsToValidate = step === 1 ? ['title', 'description'] : step === 2 ? ['startDate', 'endDate'] : [];
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (isValid) setStep(step + 1);
      else toast.error('Please fix errors before proceeding');
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Event created successfully!');
        clearDraft();
        router.push('/dashboard/organizer');
      } else {
        toast.error(json.error || 'Failed to create event');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirm(true);
  };

  const confirmCreate = () => {
    setShowConfirm(false);
    handleSubmit(onSubmit)();
  };

  const getReviewData = () => {
    const values = getValues();
    return {
      title: values.title || '—',
      description: values.description || '—',
      startDate: values.startDate ? new Date(values.startDate).toLocaleString() : '—',
      endDate: values.endDate ? new Date(values.endDate).toLocaleString() : '—',
      venueId: values.venueId || 'Not specified',
      status: values.status === 'published' ? 'Published (visible to all)' : 'Draft (only visible to organizers)',
    };
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Create New Event</h1>
        <Tooltip content="Step {step} of 3">
          <span className="text-sm text-gray-400">Step {step} of 3</span>
        </Tooltip>
      </div>

      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-all ${
              step >= s ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      <form className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 text-blue-400">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Event Title *</label>
              <input
                {...register('title')}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Tech Conference 2026"
                autoFocus
              />
              {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe your event..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">Date & Time</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Start Date & Time *</label>
              <input
                type="datetime-local"
                {...register('startDate')}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-400">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">End Date & Time *</label>
              <input
                type="datetime-local"
                {...register('endDate')}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-400">{errors.endDate.message}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 text-blue-400">
              <MapPin className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">Venue & Status</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Venue ID (Optional)</label>
              <input
                {...register('venueId')}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter venue ID (if known)"
              />
              <p className="mt-1 text-xs text-gray-500">You can also assign a venue later.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Event Status *</label>
              <select
                {...register('status')}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="draft">Draft (only visible to organizers)</option>
                <option value="published">Published (visible to vendors and attendees)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {getValues('status') === 'published' 
                  ? 'Vendors can submit proposals and attendees can register.' 
                  : 'Keep as draft until ready to publish.'}
              </p>
            </div>
            <div className="rounded-md bg-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-300">Review All Details</h3>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Title:</dt>
                  <dd className="text-white">{getReviewData().title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Description:</dt>
                  <dd className="text-white max-w-xs text-right truncate">{getReviewData().description}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Start:</dt>
                  <dd className="text-white">{getReviewData().startDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">End:</dt>
                  <dd className="text-white">{getReviewData().endDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Venue ID:</dt>
                  <dd className="text-white">{getReviewData().venueId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Status:</dt>
                  <dd className="text-white">{getReviewData().status}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="ml-auto">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleFinalSubmit} disabled={loading} className="ml-auto">
              {loading ? 'Creating...' : 'Create Event'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Keyboard hints */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <span className="mr-4">⌘+N: First step</span>
        <span className="mr-4">⌘+S: Submit (on step 3)</span>
        <span>⎋: Cancel</span>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm Event Creation"
        description={`Are you sure you want to create the event "${getValues('title') || 'Untitled'}" with status "${getValues('status') === 'published' ? 'Published' : 'Draft'}"? You can always edit it later.`}
        onConfirm={confirmCreate}
        confirmText="Yes, Create Event"
        cancelText="Go Back"
      />
    </div>
  );
}