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

export interface SortableItem {
  id: string;       // unique key (e.g. "ARG" or "3")
  label: string;    // primary text
  sublabel?: string; // secondary text shown in muted colour
  badge?: string;   // short badge shown before label (e.g. FIFA code)
}

function Row({ item, rank }: { item: SortableItem; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

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
        isDragging ? "bg-gold/10 border-gold/40 shadow-lg" : "bg-ink-soft border-paper/10"
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
      <span className="text-xs text-paper/40 tabular-nums w-5 text-right shrink-0">
        {rank}
      </span>

      {/* Optional badge */}
      {item.badge && (
        <span className="text-xs font-mono text-paper/40 w-8 shrink-0">{item.badge}</span>
      )}

      {/* Label + sublabel */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        {item.sublabel && (
          <p className="text-xs text-paper/40 truncate">{item.sublabel}</p>
        )}
      </div>
    </div>
  );
}

export function SortableList({
  initialItems,
  onChange,
}: {
  initialItems: SortableItem[];
  onChange: (orderedIds: string[]) => void;
}) {
  const [items, setItems] = useState<SortableItem[]>(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onChange(reordered.map((t) => t.id));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {items.map((item, i) => (
            <Row key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
