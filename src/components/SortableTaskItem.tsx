import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Task, CustomCategory } from '../types';

interface SortableTaskItemProps {
  key?: React.Key;
  task: Task;
  categories: CustomCategory[];
  isSelected: boolean;
  onClick: () => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPlan: (task: Task) => void | Promise<void>;
  formatDeadline: (isoString: string) => { formattedDate: string; urgencyBadge: React.ReactNode };
}

export default function SortableTaskItem({
  task,
  categories,
  isSelected,
  onClick,
  onToggleComplete,
  onDelete,
  onPlan,
  formatDeadline
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const dl = formatDeadline(task.deadline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'bg-slate-900 text-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]' 
          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners}
            className="mt-1 p-1 text-slate-400 hover:text-slate-750 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 flex items-center justify-center"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
          />
          <div>
            <p className={`text-sm font-display font-bold leading-tight ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono">
              {(() => {
                const categoryObj = categories.find(c => c.id === task.category) || {
                  id: task.category,
                  name: task.category.charAt(0).toUpperCase() + task.category.slice(1),
                  color: 'bg-slate-50 border-slate-200 text-slate-700',
                  icon: '🏷️'
                };
                return (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${categoryObj.color}`}>
                    <span>{categoryObj.icon}</span>
                    <span>{categoryObj.name}</span>
                  </span>
                );
              })()}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-600">
                Diff: {task.difficulty}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 border border-rose-150 text-rose-700">
                Panic: {task.panicLevel}/10
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className={`p-1 rounded hover:bg-rose-100 ${isSelected ? 'text-rose-450 hover:text-rose-600' : 'text-slate-400 hover:text-rose-600'}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 font-mono">
          {dl.formattedDate}
        </div>
        <div className="flex items-center gap-1.5">
          {dl.urgencyBadge}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlan(task);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
              isSelected 
                ? 'bg-emerald-400 border-emerald-500 text-slate-950 hover:bg-emerald-300' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-50'
            }`}
          >
            Plan ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
