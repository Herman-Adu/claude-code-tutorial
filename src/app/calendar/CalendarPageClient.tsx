'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarView, ViewToggle, type ViewType, type CalendarEventType } from '@/features/calendar';
import { TaskEditModal, type TaskFormData } from '@/components/shared';
import type { Task } from '@/types';
import { updateTask as updateTaskAction } from '@/app/actions/tasks';
import { columnIdToDb, priorityToDb } from '@/types';

/**
 * Client component for the Calendar page.
 * Contains all the interactive UI logic for the calendar view.
 */
export default function CalendarPageClient() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleViewChange = useCallback(
    (view: ViewType) => {
      if (view === 'kanban') {
        router.push('/');
      }
    },
    [router]
  );

  const handleEventClick = useCallback((event: CalendarEventType) => {
    // The task is stored in the event's resource property
    setEditingTask(event.resource);
    setIsModalOpen(true);
  }, []);

  const handleSlotSelect = useCallback((slotInfo: { start: Date; end: Date }) => {
    // Could be used to create a new task with the selected date pre-filled
    // For now, just open the form with the date
    console.log('Selected slot:', slotInfo);
  }, []);

  const handleSubmitTask = useCallback(
    async (taskData: TaskFormData) => {
      if (editingTask) {
        // Update the task via server action
        await updateTaskAction(editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: priorityToDb[taskData.priority],
          tags: taskData.tags,
          columnId: columnIdToDb[taskData.columnId],
          categories: taskData.categories,
          dueDate: taskData.dueDate,
          dueTime: taskData.dueTime,
          isAllDay: taskData.isAllDay,
        });
      }
      setIsModalOpen(false);
      setEditingTask(null);
      // The CalendarView will refetch on its own when the page is re-rendered
      // or we could add a refresh mechanism
      router.refresh();
    },
    [editingTask, router]
  );

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="inline-block glass-lg px-8 py-4 mb-4">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
                  Calendar
                </h1>
              </div>
              <p className="text-slate-500 font-medium tracking-wide">
                View your tasks by date
              </p>
            </div>
            <ViewToggle activeView="calendar" onViewChange={handleViewChange} />
          </div>
        </header>

        <CalendarView
          onEventClick={handleEventClick}
          onSlotSelect={handleSlotSelect}
        />
      </div>

      <TaskEditModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSubmitTask}
      />
    </main>
  );
}
