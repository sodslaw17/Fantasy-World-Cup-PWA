"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface Team {
  code: string;
  name: string;
}

function SortableItem({ team, rank }: { team: Team; rank: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.code });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
      }}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 select-none ${
        isDragging
          ? "bg-gold/10 border-gold/40 shadow-lg"
          : "bg-ink-soft border-paper/10"
      }`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-paper/25 cursor-grab active:cursor-grabbing touch-none shrink-0 text-lg leading-none"
        aria-label="Drag to reorder"
      >
        ⠿
      </span>

      {/* Rank */}
      <span className="text-xs text-paper/40 tabular-nums w-6 text-right shrink-0">
        {rank}
      </span>

      {/* Team */}
      <span className="text-xs font-mono text-paper/40 w-8 shrink-0">
        {team.code}
      </span>
      <span className="text-sm font-medium flex-1 truncate">{team.name}</span>
    </div>
  );
}

export function SortableTeamList({
  teams,
  onChange,
}: {
  teams: Team[];          // initial ordered list
  onChange: (ordered: string[]) => void; // called with fifa_codes in new order
}) {
  const [items, setItems] = useState<Team[]>(teams);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((t) => t.code === active.id);
      const newIndex = items.findIndex((t) => t.code === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onChange(reordered.map((t) => t.code));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((t) => t.code)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((team, i) => (
            <SortableItem key={team.code} team={team} rank={i + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
