import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Calendar, GripVertical } from "lucide-react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { formatDueDate, cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const KanbanCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${isDragging ? 2 : 0}deg) scale(${isDragging ? 1.05 : 1})`,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("card cursor-grab p-4 active:cursor-grabbing", isDragging && "z-10 rotate-2 scale-105 opacity-95 shadow-clay-hover")}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="flex-1 text-[13px] font-medium leading-snug">{task.title}</p>
        <button {...listeners} {...attributes} className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      {task.description && <p className="mb-2 line-clamp-2 text-[11.5px] text-muted-foreground">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ column, tasks }: { column: typeof COLUMNS[0]; tasks: Task[] }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{column.title}</span>
        <span className="rounded-full bg-elevated px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-clay-inset">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn("min-h-[200px] flex-1 space-y-3 rounded-clay-lg border-2 border-dashed p-3 transition-all", isOver ? "border-primary bg-primary/10 shadow-clay-inset" : "border-transparent bg-elevated/40")}
      >
        {tasks.map((t) => <KanbanCard key={t.id} task={t} />)}
      </div>
    </div>
  );
};

export const KanbanBoard = ({
  tasks,
  onStatusChange,
}: {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    const target = COLUMNS.find((c) => c.id === over.id);
    if (target && target.id !== task.status) onStatusChange(task.id, target.id);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <KanbanColumn key={c.id} column={c} tasks={tasks.filter((t) => t.status === c.id)} />
        ))}
      </div>
    </DndContext>
  );
};