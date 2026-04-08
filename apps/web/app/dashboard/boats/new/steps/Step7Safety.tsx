"use client";

import { useState, useCallback } from "react";
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
import { GripVertical, Pencil, Trash2, Plus, Check, X, AlertTriangle, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { WizardData } from "../types";

// ─── Sortable safety card ───

function SortableSafetyCard({
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined };

  const hasPlaceholder = text.includes("[location]") || text.includes("[");

  function saveEdit() {
    if (editText.trim()) onEdit(editText.trim());
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-tight py-standard px-standard border rounded-card bg-white group",
        hasPlaceholder && !editing ? "border-warning-text border-dashed" : "border-border",
        isDragging && "shadow-lg opacity-80"
      )}
    >
      <button {...attributes} {...listeners} className="mt-[2px] cursor-grab text-grey-text touch-none">
        <GripVertical size={14} />
      </button>

      {editing ? (
        <div className="flex-1 space-y-tight">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full p-tight border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none resize-none"
          />
          <div className="flex gap-tight">
            <button onClick={saveEdit} className="text-success-text"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="text-grey-text"><X size={14} /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <p className="text-body text-dark-text">{text}</p>
            {hasPlaceholder && (
              <p className="text-[11px] text-warning-text mt-micro">
                ⚠️ Contains placeholder — click edit to fill in your specific location
              </p>
            )}
          </div>
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

// ─── Additional waiver clauses ───

const ADDITIONAL_CLAUSES: { label: string; text: string }[] = [
  {
    label: "+ Medical conditions clause",
    text: `\n\nMEDICAL CONDITIONS ADDENDUM\nI confirm that I have disclosed all relevant medical conditions, medications, and allergies to the captain prior to departure. I understand that failure to disclose relevant medical information may affect my safety and the safety of others onboard.`,
  },
  {
    label: "+ Weather cancellation clause",
    text: `\n\nWEATHER AND CANCELLATION POLICY\nThe captain reserves the right to cancel, shorten, or alter the charter route due to adverse weather conditions. Safety is the primary consideration. In the event of a weather cancellation by the Operator, guests will be offered a full reschedule or refund.`,
  },
  {
    label: "+ Photography/media release",
    text: `\n\nPHOTOGRAPHY AND MEDIA RELEASE\nI grant the Operator permission to use photographs and video taken during this charter for marketing and promotional purposes. I may opt out by informing the captain before departure.`,
  },
  {
    label: "+ Minor passengers clause",
    text: `\n\nMINOR PASSENGERS\nI confirm that I am the parent or legal guardian of any minors in my party. I accept full responsibility for their safety and behaviour. Children under 6 must wear USCG-approved life jackets at all times while onboard.`,
  },
  {
    label: "+ Alcohol liability clause",
    text: `\n\nALCOHOL LIABILITY\nI acknowledge that alcohol consumption is at my own discretion and risk. The Operator is not liable for any incidents resulting from alcohol consumption. The captain reserves the right to refuse further alcohol service and to return to dock if guest behaviour becomes unsafe.`,
  },
];

// ─── Step 7 ───

interface Step7Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step7Safety({ data, onNext }: Step7Props) {
  const [safetyPoints, setSafetyPoints] = useState(data.safetyPoints);
  const [waiverText, setWaiverText] = useState(data.waiverText);
  const [showPreview, setShowPreview] = useState(false);
  const [addingPoint, setAddingPoint] = useState(false);
  const [newPoint, setNewPoint] = useState("");
  const [showClauses, setShowClauses] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = safetyPoints.map((_, i) => `safety-${i}`);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        setSafetyPoints((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    },
    [ids]
  );

  function editPoint(index: number, text: string) {
    setSafetyPoints((prev) => { const u = [...prev]; u[index] = text; return u; });
  }

  function deletePoint(index: number) {
    setSafetyPoints((prev) => prev.filter((_, i) => i !== index));
  }

  function addPoint() {
    if (newPoint.trim()) {
      setSafetyPoints((prev) => [...prev, newPoint.trim()]);
      setNewPoint("");
      setAddingPoint(false);
    }
  }

  function appendClause(text: string) {
    setWaiverText((prev) => prev + text);
  }

  function handleContinue() {
    onNext({ safetyPoints, waiverText });
  }

  return (
    <div className="space-y-section">
      {/* PART A — Safety briefing cards */}
      <div>
        <h3 className="text-h3 text-dark-text">Safety briefing points</h3>
        <p className="text-caption text-grey-text mt-micro">
          Guests swipe through these cards and tap &quot;Understood&quot; on each before signing the waiver.
        </p>

        <div className="mt-standard space-y-tight">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {safetyPoints.map((point, i) => (
                <SortableSafetyCard
                  key={ids[i]}
                  id={ids[i]!}
                  text={point}
                  onEdit={(text) => editPoint(i, text)}
                  onDelete={() => deletePoint(i)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {addingPoint ? (
            <div className="flex items-start gap-tight">
              <textarea
                autoFocus
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                rows={2}
                placeholder="New safety point…"
                className="flex-1 p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
              />
              <button onClick={addPoint} className="text-success-text mt-tight"><Check size={16} /></button>
              <button onClick={() => { setAddingPoint(false); setNewPoint(""); }} className="text-grey-text mt-tight"><X size={16} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPoint(true)}
              className="flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
            >
              <Plus size={16} /> Add safety point
            </button>
          )}
        </div>

        {/* Preview card */}
        <div className="mt-page border-2 border-navy rounded-card p-card bg-light-blue max-w-[300px]">
          <div className="flex items-center gap-tight mb-tight">
            <Shield size={16} className="text-navy" />
            <span className="text-[10px] text-navy font-semibold uppercase tracking-wider">
              Safety briefing
            </span>
          </div>
          <p className="text-body text-dark-text">
            {safetyPoints[0] ?? "Your first safety point appears here"}
          </p>
          <button className="w-full h-[40px] mt-standard bg-navy text-white text-label rounded-btn">
            Understood ✓
          </button>
        </div>
      </div>

      {/* PART B — Liability waiver */}
      <div>
        <h3 className="text-h3 text-dark-text">Liability waiver</h3>
        <p className="text-caption text-grey-text mt-micro">
          Guests sign this individually with their typed name. Each signature is timestamped.
        </p>

        {/* Disclaimer */}
        <div className="mt-standard p-standard bg-warning-bg rounded-chip flex items-start gap-tight">
          <AlertTriangle size={14} className="text-warning-text shrink-0 mt-[2px]" />
          <p className="text-[12px] text-warning-text">
            DockPass provides this template as a starting point. Consult a maritime attorney to ensure your waiver provides adequate protection.
          </p>
        </div>

        {/* Edit / Preview toggle */}
        <div className="mt-standard flex gap-tight">
          <button
            onClick={() => setShowPreview(false)}
            className={cn(
              "px-standard py-tight rounded-pill text-label transition-all",
              !showPreview ? "bg-navy text-white" : "bg-off-white text-grey-text"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={cn(
              "px-standard py-tight rounded-pill text-label transition-all",
              showPreview ? "bg-navy text-white" : "bg-off-white text-grey-text"
            )}
          >
            Preview
          </button>
        </div>

        {showPreview ? (
          <div className="mt-standard border border-border rounded-card p-card bg-off-white">
            <pre className="whitespace-pre-wrap text-body text-dark-text font-sans text-[13px] leading-relaxed">
              {waiverText}
            </pre>
            <div className="mt-page border-t border-border pt-standard">
              <p className="text-[12px] text-grey-text">Signed by:</p>
              <p className="text-body text-dark-text italic mt-tight">Sofia Martinez</p>
              <p className="text-[11px] text-grey-text mt-micro">
                April 8, 2026 at 2:30 PM EST
              </p>
            </div>
          </div>
        ) : (
          <textarea
            value={waiverText}
            onChange={(e) => setWaiverText(e.target.value)}
            rows={16}
            className="mt-standard w-full min-h-[400px] p-standard border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none resize-none font-mono text-[13px]"
          />
        )}

        {/* Common additions */}
        <div className="mt-standard">
          <button
            type="button"
            onClick={() => setShowClauses(!showClauses)}
            className="flex items-center gap-micro text-label text-dark-text"
          >
            <ChevronDown size={14} className={cn("transition-transform", showClauses && "rotate-180")} />
            Add standard clauses
          </button>
          {showClauses && (
            <div className="mt-tight flex flex-wrap gap-tight">
              {ADDITIONAL_CLAUSES.map((clause) => (
                <button
                  key={clause.label}
                  type="button"
                  onClick={() => appendClause(clause.text)}
                  className="px-standard py-[6px] rounded-pill text-label text-navy bg-light-blue border border-navy/20 hover:bg-navy hover:text-white transition-all"
                >
                  {clause.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
