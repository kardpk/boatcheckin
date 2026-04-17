"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Plus, Trash2, Package, Utensils, Camera, Waves,
  Wine, Music, Fuel, Check, ChevronDown, Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { WizardField } from "@/components/ui/WizardField";
import { validateUpload } from "@/lib/security/uploads";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData, WizardAddon, BoatTypeKey } from "../types";

// ─── MASTER_DESIGN R1: no emojis — map addon name → lucide icon ───
function addonCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/chef|food|meal|cater|picnic|lunch|dinner/.test(n)) return Utensils;
  if (/photo|camera|photog/.test(n)) return Camera;
  if (/dive|snorkel|surf|wakeboard|wake|water.*sport|water.*toy|tube|towable/.test(n)) return Waves;
  if (/champagne|wine|bar|beverage|spirit|bottle|cocktail|drink/.test(n)) return Wine;
  if (/music|band|dj|entertain/.test(n)) return Music;
  if (/fuel|surcharge|extend/.test(n)) return Fuel;
  return Package; // default
}

// Preset icon options for custom addon icon picker
const ADDON_ICON_OPTIONS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Package,  label: "Service" },
  { Icon: Utensils, label: "Food" },
  { Icon: Camera,   label: "Photo" },
  { Icon: Waves,    label: "Water" },
  { Icon: Wine,     label: "Drinks" },
  { Icon: Music,    label: "Music" },
];


interface Step9Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  saving?: boolean;
  template: BoatTemplate | null;
}

export function Step9Photos({ data, onNext, saving, template }: Step9Props) {

  const fileRef = useRef<HTMLInputElement>(null);
  const [boatPhotos, setBoatPhotos] = useState<File[]>(data.boatPhotos);
  const [boatPhotosPreviews, setBoatPhotosPreviews] = useState<string[]>(data.boatPhotosPreviews);
  const [photoError, setPhotoError] = useState("");
  const [addons, setAddons] = useState<WizardAddon[]>(data.addons);
  const [showCustomAddon, setShowCustomAddon] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customIconIdx, setCustomIconIdx] = useState(0); // index into ADDON_ICON_OPTIONS
  const [customPrice, setCustomPrice] = useState("");
  const [customMaxQty, setCustomMaxQty] = useState("10");

  // Photo handling
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotoError("");

    const remaining = MAX_PHOTOS - boatPhotos.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      const result = validateUpload(file);
      if (!result.valid) {
        setPhotoError(result.error ?? "Invalid file");
        return;
      }
    }

    // Create previews
    const newPreviews: string[] = [];
    const newFiles: File[] = [];

    let processed = 0;
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push(file);
        newPreviews.push(reader.result as string);
        processed++;
        if (processed === toAdd.length) {
          setBoatPhotos((prev) => [...prev, ...newFiles]);
          setBoatPhotosPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(index: number) {
    setBoatPhotos((prev) => prev.filter((_, i) => i !== index));
    setBoatPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // Add-on handling
  function addFromSuggestion(suggestion: { name: string; description: string; emoji: string; suggestedPrice: number }) {
    const addon: WizardAddon = {
      id: `addon-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: suggestion.name,
      description: suggestion.description,
      emoji: suggestion.emoji,
      priceCents: suggestion.suggestedPrice,
      maxQuantity: 10,
    };
    setAddons((prev) => [...prev, addon]);
  }

  function addCustomAddon() {
    if (!customName.trim()) return;
    const addon: WizardAddon = {
      id: `addon-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: customName.trim(),
      description: customDesc.trim(),
      emoji: "",  // emoji field kept for DB compat but unused in UI
      priceCents: Math.round(parseFloat(customPrice || "0") * 100),
      maxQuantity: parseInt(customMaxQty) || 10,
    };
    setAddons((prev) => [...prev, addon]);
    setCustomName("");
    setCustomDesc("");
    setCustomIconIdx(0);
    setCustomPrice("");
    setCustomMaxQty("10");
    setShowCustomAddon(false);
  }

  function removeAddon(id: string) {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAddonPrice(id: string, dollars: string) {
    setAddons((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, priceCents: Math.round(parseFloat(dollars || "0") * 100) } : a
      )
    );
  }

  function updateAddonQty(id: string, qty: string) {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, maxQuantity: parseInt(qty) || 1 } : a))
    );
  }

  // Already added check
  const addedAddonNames = new Set(addons.map((a) => a.name));

  function handleContinue() {
    onNext({ boatPhotos, boatPhotosPreviews, addons });
  }

  return (
    <div className="space-y-section">
      {/* SECTION 1 — Photos */}
      <div>
        <h3 className="text-h3 text-dark-text">Photos of your boat</h3>
        <p className="text-caption text-grey-text mt-micro">
          Add photos that appear in your guest&apos;s trip page. Clear, well-lit photos convert best.
        </p>

        {/* Photo grid */}
        <div className="mt-standard grid grid-cols-2 md:grid-cols-4 gap-tight">
          {boatPhotosPreviews.map((preview, i) => (
            <div key={i} className="relative w-full aspect-[4/3] rounded-card overflow-hidden border border-border group">
              <Image src={preview} alt={`Boat photo ${i + 1}`} fill className="object-cover" unoptimized />
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-navy text-white text-[10px] font-semibold px-2 py-[2px] rounded-pill">
                  Cover photo
                </span>
              )}
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {boatPhotos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-card border-2 border-dashed border-border hover:border-border-dark transition-colors flex flex-col items-center justify-center gap-micro"
            >
              <Plus size={20} className="text-grey-text" />
              <span className="text-micro text-grey-text">Add photo</span>
            </button>
          )}
        </div>

        {photoError && (
          <p className="text-[12px] text-error-text mt-tight">{photoError}</p>
        )}
        <p className="text-[11px] text-grey-text mt-tight">
          {boatPhotos.length}/{MAX_PHOTOS} photos · JPEG, PNG, WebP · Max 5MB each
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Tips */}
        <div className="mt-standard p-standard bg-light-blue rounded-chip">
          <p className="text-[12px] text-navy font-semibold">Photo tips that work best:</p>
          <div className="mt-micro text-[12px] text-dark-text space-y-[2px]">
            <p>✓ Deck and seating area</p>
            <p>✓ Interior/cabin (if applicable)</p>
            <p>✓ Captain at helm</p>
            <p>✓ Guests enjoying the experience</p>
            <p>✓ The view from the boat</p>
            <p className="text-grey-text">✗ Avoid blurry or dark photos</p>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Add-ons */}
      <div>
        {/* Section header */}
        <div style={{ marginBottom: 'var(--s-3)' }}>
          <h3
            className="font-display"
            style={{ fontSize: 'var(--t-body-lg)', fontWeight: 500, color: 'var(--color-ink)' }}
          >
            Add-on menu
          </h3>
          <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 2 }}>
            Items guests can request before arriving. You earn the full amount.
          </p>
        </div>

        {/* Beta banner — polished, no infrastructure mention */}
        <div
          className="alert alert--info"
          style={{ marginBottom: 'var(--s-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)' }}
        >
          <Info size={15} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-status-info)' }} aria-hidden="true" />
          <div>
            <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>
              Add-on payments are not available in the Beta.
            </p>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              Your menu is saved and will activate automatically when we launch.
            </p>
          </div>
        </div>

        {/* Suggested add-ons */}
        {template && template.suggestedAddons.length > 0 && (
          <div style={{ marginBottom: 'var(--s-4)' }}>
            <p
              className="mono"
              style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-2)' }}
            >
              Suggested for {template.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
              {template.suggestedAddons
                .filter((s) => !addedAddonNames.has(s.name))
                .map((s) => {
                  const AddonIcon = addonCategoryIcon(s.name);
                  return (
                    <div
                      key={s.name}
                      className="tile"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--s-3) var(--s-4)',
                        gap: 'var(--s-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flex: 1, minWidth: 0 }}>
                        {/* Icon tile — no emoji */}
                        <div
                          style={{
                            width: 36, height: 36, flexShrink: 0,
                            borderRadius: 'var(--r-1)',
                            background: 'var(--color-bone)',
                            border: '1px solid var(--color-line-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <AddonIcon size={16} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>{s.name}</p>
                          <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 1 }}>{s.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addFromSuggestion(s)}
                        className="btn btn--ghost btn--sm"
                        style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                      >
                        Add to menu
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Active add-ons */}
        {addons.length > 0 && (
          <div style={{ marginBottom: 'var(--s-4)' }}>
            <p
              className="mono"
              style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-2)' }}
            >
              Your menu ({addons.length} item{addons.length !== 1 ? 's' : ''})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
              {addons.map((addon) => {
                const AddonIcon = addonCategoryIcon(addon.name);
                return (
                  <div
                    key={addon.id}
                    className="tile"
                    style={{
                      padding: 'var(--s-4)',
                      borderLeft: '3px solid var(--color-brass)',
                    }}
                  >
                    {/* Row: icon + name/desc + remove */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>
                      <div
                        style={{
                          width: 32, height: 32, flexShrink: 0,
                          borderRadius: 'var(--r-1)',
                          background: 'var(--color-bone)',
                          border: '1px solid var(--color-line-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <AddonIcon size={14} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>{addon.name}</p>
                        {addon.description && (
                          <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 2 }}>{addon.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeAddon(addon.id)}
                        style={{ color: 'var(--color-ink-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                        aria-label="Remove add-on"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    {/* Price + qty row */}
                    <div style={{ display: 'flex', gap: 'var(--s-5)' }}>
                      <WizardField label="Price" htmlFor={`price-${addon.id}`}>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 'var(--s-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', fontSize: 'var(--t-body-sm)' }}>$</span>
                          <input
                            id={`price-${addon.id}`}
                            type="number"
                            step="0.01"
                            min={0}
                            value={(addon.priceCents / 100).toFixed(2)}
                            onChange={(e) => updateAddonPrice(addon.id, e.target.value)}
                            className="field-input"
                            style={{ width: 120, paddingLeft: 'var(--s-5)' }}
                          />
                        </div>
                      </WizardField>
                      <WizardField label="Max qty" htmlFor={`qty-${addon.id}`}>
                        <input
                          id={`qty-${addon.id}`}
                          type="number"
                          min={1}
                          value={addon.maxQuantity}
                          onChange={(e) => updateAddonQty(addon.id, e.target.value)}
                          className="field-input"
                          style={{ width: 80 }}
                        />
                      </WizardField>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom add-on form */}
        {showCustomAddon ? (
          <div
            className="tile"
            style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
          >
            {/* Icon picker — 6 preset category icons */}
            <div>
              <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-2)' }}>Icon</p>
              <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                {ADDON_ICON_OPTIONS.map(({ Icon, label }, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCustomIconIdx(idx)}
                    style={{
                      width: 40, height: 40,
                      borderRadius: 'var(--r-1)',
                      border: customIconIdx === idx ? '2px solid var(--color-brass)' : '1px solid var(--color-line)',
                      background: customIconIdx === idx ? 'var(--color-bone)' : 'var(--color-paper)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                    }}
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={16} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Add-on name"
              className="field-input"
            />
            <input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="field-input"
            />
            <div style={{ display: 'flex', gap: 'var(--s-4)' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 'var(--s-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', fontSize: 'var(--t-body-sm)' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="field-input"
                  style={{ width: 120, paddingLeft: 'var(--s-5)' }}
                />
              </div>
              <input
                type="number"
                min={1}
                value={customMaxQty}
                onChange={(e) => setCustomMaxQty(e.target.value)}
                placeholder="Max qty"
                className="field-input"
                style={{ width: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
              <button
                onClick={addCustomAddon}
                disabled={!customName.trim()}
                className="btn btn--rust btn--sm"
              >
                <Check size={14} strokeWidth={2.5} /> Save
              </button>
              <button
                onClick={() => setShowCustomAddon(false)}
                className="btn btn--ghost btn--sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomAddon(true)}
            className="btn btn--ghost btn--sm"
            style={{ gap: 'var(--s-1)', color: 'var(--color-ink-muted)' }}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Add custom item
          </button>
        )}

        {/* Skip */}
        <div style={{ marginTop: 'var(--s-4)' }}>
          <button
            type="button"
            onClick={handleContinue}
            style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Skip for now — I&apos;ll add these later
          </button>
        </div>
      </div>

      <ContinueButton onClick={handleContinue} loading={saving ?? false}>Save boat profile →</ContinueButton>
    </div>
  );
}


        {/* Suggested add-ons */}
        {template && template.suggestedAddons.length > 0 && (
          <div className="mt-standard">
            <p className="text-label text-grey-text mb-tight">Suggested for {template.label}</p>
            <div className="space-y-tight">
              {template.suggestedAddons
                .filter((s) => !addedAddonNames.has(s.name))
                .map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between p-standard border border-border rounded-card"
                  >
                    <div className="flex items-center gap-tight">
                      <span className="text-[20px]">{s.emoji}</span>
                      <div>
                        <p className="text-label text-dark-text">{s.name}</p>
                        <p className="text-[11px] text-grey-text">{s.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addFromSuggestion(s)}
                      className="px-standard py-tight text-label text-navy bg-light-blue rounded-btn hover:bg-navy hover:text-white transition-all shrink-0"
                    >
                      Add to menu
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active add-ons */}
        {addons.length > 0 && (
          <div className="mt-page">
            <p className="text-label text-dark-text mb-tight">Your menu</p>
            <div className="space-y-tight">
              {addons.map((addon) => (
                <div key={addon.id} className="p-standard border border-navy/20 rounded-card bg-light-blue">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-tight">
                      <span className="text-[20px]">{addon.emoji}</span>
                      <div>
                        <p className="text-label text-dark-text">{addon.name}</p>
                        <p className="text-[11px] text-grey-text">{addon.description}</p>
                      </div>
                    </div>
                    <button onClick={() => removeAddon(addon.id)} className="text-grey-text hover:text-error-text">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-page mt-tight">
                    <WizardField label="Price" htmlFor={`price-${addon.id}`}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-text text-body">$</span>
                        <input
                          id={`price-${addon.id}`}
                          type="number"
                          step="0.01"
                          min={0}
                          value={(addon.priceCents / 100).toFixed(2)}
                          onChange={(e) => updateAddonPrice(addon.id, e.target.value)}
                          className="w-[120px] h-[36px] pl-6 pr-standard border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none"
                        />
                      </div>
                    </WizardField>
                    <WizardField label="Max qty" htmlFor={`qty-${addon.id}`}>
                      <input
                        id={`qty-${addon.id}`}
                        type="number"
                        min={1}
                        value={addon.maxQuantity}
                        onChange={(e) => updateAddonQty(addon.id, e.target.value)}
                        className="w-[80px] h-[36px] px-standard border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none"
                      />
                    </WizardField>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom add-on */}
        {showCustomAddon ? (
          <div className="mt-standard p-standard border border-border rounded-card space-y-standard">
            <div className="flex items-center gap-standard">
              <input
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-[50px] h-[40px] text-center text-[20px] border border-border rounded-input focus:border-border-dark focus:outline-none"
              />
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add-on name"
                className="flex-1 h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
            </div>
            <input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Short description"
              className="w-full h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <div className="flex gap-standard">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-text text-body">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-[120px] h-[40px] pl-6 pr-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </div>
              <input
                type="number"
                min={1}
                value={customMaxQty}
                onChange={(e) => setCustomMaxQty(e.target.value)}
                placeholder="Max qty"
                className="w-[80px] h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
            </div>
            <div className="flex gap-tight">
              <button
                onClick={addCustomAddon}
                disabled={!customName.trim()}
                className="px-page py-tight bg-navy text-white text-label rounded-btn disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => setShowCustomAddon(false)}
                className="px-page py-tight text-label text-grey-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomAddon(true)}
            className="mt-standard flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
          >
            <Plus size={16} /> Add custom item
          </button>
        )}

        {/* Skip option */}
        <button
          type="button"
          onClick={handleContinue}
          className="mt-standard text-label text-grey-text hover:text-dark-text transition-colors"
        >
          Skip for now — I&apos;ll add these later
        </button>
      </div>

      <ContinueButton onClick={handleContinue} loading={saving ?? false}>Save boat profile →</ContinueButton>
    </div>
  );
}
