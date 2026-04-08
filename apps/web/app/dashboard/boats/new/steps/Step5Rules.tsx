"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { WizardData, CustomRuleSection } from "../types";

// ─── Sortable item ───

function SortableRuleItem({
  id,
  text,
  onEdit,
  onDelete,
}: {
  id: string;
  text: string;
  onEdit: (newText: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  function saveEdit() {
    if (editText.trim()) {
      onEdit(editText.trim());
    }
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-tight py-tight px-standard border border-border rounded-input bg-white group",
        isDragging && "shadow-lg opacity-80"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-grey-text hover:text-dark-text touch-none">
        <GripVertical size={14} />
      </button>

      {editing ? (
        <div className="flex-1 flex items-center gap-tight">
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            className="flex-1 h-[32px] px-tight border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none"
          />
          <button onClick={saveEdit} className="text-success-text"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="text-grey-text"><X size={14} /></button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-body text-dark-text">{text}</span>
          <button
            onClick={() => { setEditText(text); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 text-grey-text hover:text-dark-text transition-opacity"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-grey-text hover:text-error-text transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Draggable list ───

function DraggableList({
  title,
  items,
  setItems,
  addLabel,
}: {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
  addLabel: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((_, i) => `item-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  }

  function editItem(index: number, newText: string) {
    const updated = [...items];
    updated[index] = newText;
    setItems(updated);
  }

  function deleteItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addItem() {
    if (newText.trim()) {
      setItems([...items, newText.trim()]);
      setNewText("");
      setAdding(false);
    }
  }

  return (
    <div>
      <h3 className="text-h3 text-dark-text">{title}</h3>
      <div className="mt-standard space-y-tight">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item, i) => (
              <SortableRuleItem
                key={ids[i]}
                id={ids[i]!}
                text={item}
                onEdit={(text) => editItem(i, text)}
                onDelete={() => deleteItem(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {adding ? (
          <div className="flex items-center gap-tight">
            <input
              autoFocus
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder={addLabel}
              className="flex-1 h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <button onClick={addItem} className="text-success-text"><Check size={16} /></button>
            <button onClick={() => { setAdding(false); setNewText(""); }} className="text-grey-text"><X size={16} /></button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
          >
            <Plus size={16} /> Add rule
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 5 ───

interface Step5Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step5Rules({ data, onNext }: Step5Props) {
  const [standardRules, setStandardRules] = useState(data.standardRules);
  const [customDos, setCustomDos] = useState(data.customDos);
  const [customDonts, setCustomDonts] = useState(data.customDonts);
  const [customRuleSections, setCustomRuleSections] = useState<CustomRuleSection[]>(
    data.customRuleSections
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionType, setSectionType] = useState<"bullet" | "numbered" | "check">("bullet");

  function addSection() {
    if (!sectionTitle.trim()) return;
    const section: CustomRuleSection = {
      id: `section-${Date.now()}`,
      title: sectionTitle.trim(),
      items: [],
      type: sectionType,
    };
    setCustomRuleSections((prev) => [...prev, section]);
    setSectionTitle("");
    setShowAddSection(false);
  }

  function updateSectionItems(id: string, items: string[]) {
    setCustomRuleSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, items } : s))
    );
  }

  function deleteSection(id: string) {
    setCustomRuleSections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleContinue() {
    onNext({ standardRules, customDos, customDonts, customRuleSections });
  }

  return (
    <div className="space-y-section">
      {/* House rules */}
      <div>
        <p className="text-caption text-grey-text mb-standard">
          These are your non-negotiable vessel rules for every charter.
        </p>
        <DraggableList
          title="House rules"
          items={standardRules}
          setItems={setStandardRules}
          addLabel="New house rule"
        />
      </div>

      {/* DOs */}
      <DraggableList
        title="DOs — What we encourage ✓"
        items={customDos}
        setItems={setCustomDos}
        addLabel="New DO item"
      />

      {/* DON'Ts */}
      <DraggableList
        title="DON'Ts — What's not allowed ✗"
        items={customDonts}
        setItems={setCustomDonts}
        addLabel="New DON'T item"
      />

      {/* Custom sections */}
      <div>
        <h3 className="text-h3 text-dark-text">Custom sections</h3>
        <p className="text-caption text-grey-text mt-micro">
          Create your own sections with custom titles and items
        </p>

        {customRuleSections.map((section) => (
          <div key={section.id} className="mt-page border border-border rounded-card p-standard">
            <div className="flex items-center justify-between mb-standard">
              <div className="flex items-center gap-tight">
                <h4 className="text-label text-dark-text">{section.title}</h4>
                <span className="text-[10px] text-grey-text bg-off-white px-2 py-[1px] rounded-pill">
                  {section.type}
                </span>
              </div>
              <button
                onClick={() => deleteSection(section.id)}
                className="text-grey-text hover:text-error-text"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <DraggableList
              title=""
              items={section.items}
              setItems={(items) => updateSectionItems(section.id, items)}
              addLabel="New item"
            />
          </div>
        ))}

        {showAddSection ? (
          <div className="mt-standard p-standard border border-border rounded-card space-y-standard">
            <input
              autoFocus
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Section title (e.g. Alcohol policy)"
              className="w-full h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <div className="flex gap-tight">
              {(["bullet", "numbered", "check"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSectionType(type)}
                  className={cn(
                    "px-standard py-tight rounded-pill text-label transition-all",
                    sectionType === type
                      ? "bg-navy text-white"
                      : "bg-off-white text-grey-text hover:bg-border"
                  )}
                >
                  {type === "bullet" ? "• Bullet" : type === "numbered" ? "1. Numbered" : "☑ Checklist"}
                </button>
              ))}
            </div>
            <div className="flex gap-tight">
              <button
                onClick={addSection}
                disabled={!sectionTitle.trim()}
                className="px-page py-tight bg-navy text-white text-label rounded-btn disabled:opacity-40"
              >
                Create section
              </button>
              <button
                onClick={() => { setShowAddSection(false); setSectionTitle(""); }}
                className="px-page py-tight text-label text-grey-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="mt-standard flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
          >
            <Plus size={16} /> Add section
          </button>
        )}
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
