"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorBanner, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BRANDS, CONDITIONS, type Laptop, type LaptopPayload } from "@/types";

const emptyPayload: LaptopPayload = {
  brand: "",
  model: "",
  cpu: "",
  ramGB: 16,
  storageGB: 512,
  storageType: "SSD",
  gpu: "",
  display: "",
  condition: "good",
  ageYears: 0,
  batteryHealth: 100,
  price: 0,
  location: "",
  description: "",
  status: "active",
};

export default function ListingForm({
  laptopId,
  initial,
}: {
  laptopId?: number;
  initial?: Laptop;
}) {
  const router = useRouter();
  const editing = !!initial;
  const [form, setForm] = useState<LaptopPayload>(initial ?? emptyPayload);
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState(initial?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof LaptopPayload>(key: K, value: LaptopPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.price <= 0) {
      setError("Enter a price greater than zero.");
      return;
    }
    setBusy(true);
    try {
      let id = laptopId;
      if (editing && id) {
        await api.put(`/laptops/${id}`, form);
      } else {
        const created = await api.post<Laptop>("/laptops", form);
        id = created.id;
      }
      if (files.length > 0 && id) {
        try {
          await api.upload(`/laptops/${id}/images`, files);
        } catch (upErr) {
          // Listing is saved; image failure should not block navigation.
          console.error("image upload failed", upErr);
        }
      }
      router.push(`/laptops/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this listing.");
    } finally {
      setBusy(false);
    }
  };

  const removeExistingImage = async (imageId: number) => {
    setSaving(true);
    setError("");
    try {
      await api.delete(`/images/${imageId}`);
      setExisting((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove image.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setForm(initial ?? emptyPayload);
    setExisting(initial?.images ?? []);
  }, [initial]);

  if (busy) {
    return (
      <div className="py-24 text-center">
        <Spinner className="h-8 w-8 text-brand-500" />
        <p className="mt-3 text-sm text-zinc-400">
          {editing ? "Saving changes…" : "Creating your listing…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <ErrorBanner message={error} />}

      <Section title="Basics" step="1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand *">
            <input
              list="brand-options"
              className="input"
              placeholder="Apple"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              required
            />
            <datalist id="brand-options">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Model *">
            <input
              className="input"
              placeholder={'MacBook Pro 14" M1 Pro'}
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              required
            />
          </Field>
          <Field label="Processor (CPU) *">
            <input
              className="input"
              placeholder="Apple M1 Pro (10-core)"
              value={form.cpu}
              onChange={(e) => set("cpu", e.target.value)}
              required
            />
          </Field>
          <Field label="Condition *">
            <select
              className="input"
              value={form.condition}
              onChange={(e) => set("condition", e.target.value)}
              required
            >
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Age (years)">
            <input
              type="number"
              min={0}
              max={20}
              className="input"
              value={form.ageYears}
              onChange={(e) => set("ageYears", Number(e.target.value))}
            />
          </Field>
          <Field label="Battery health (%)">
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={form.batteryHealth}
              onChange={(e) => set("batteryHealth", Math.min(100, Math.max(0, Number(e.target.value))))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Specifications" step="2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="RAM (GB)">
            <input
              type="number"
              min={0}
              step={2}
              className="input"
              value={form.ramGB}
              onChange={(e) => set("ramGB", Number(e.target.value))}
            />
          </Field>
          <Field label="Storage size (GB)">
            <input
              type="number"
              min={0}
              step={64}
              className="input"
              value={form.storageGB}
              onChange={(e) => set("storageGB", Number(e.target.value))}
            />
          </Field>
          <Field label="Storage type">
            <select
              className="input"
              value={form.storageType}
              onChange={(e) => set("storageType", e.target.value)}
            >
              <option value="SSD">SSD</option>
              <option value="HDD">HDD</option>
              <option value="SSD + HDD">SSD + HDD</option>
            </select>
          </Field>
          <Field label="Graphics (GPU)">
            <input
              className="input"
              placeholder="Integrated 16-core GPU / RTX 3050 Ti"
              value={form.gpu}
              onChange={(e) => set("gpu", e.target.value)}
            />
          </Field>
          <Field label="Display">
            <input
              className="input"
              placeholder={'14.2" Liquid Retina XDR, 3024x1964'}
              value={form.display}
              onChange={(e) => set("display", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Pricing & location" step="3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Price (USD) *">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <input
                type="number"
                min={1}
                step={10}
                className="input pl-7"
                placeholder="990"
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
                required
              />
            </div>
          </Field>
          <Field label="Location *">
            <input
              className="input"
              placeholder="Berlin, Germany"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows={5}
                className="input resize-none"
                placeholder="Condition, reason for selling, what's included, any cosmetic wear…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </div>
        {editing && (
          <div className="mt-4">
            <Field label="Listing status">
              <select
                className="input"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active — visible to buyers</option>
                <option value="sold">Sold</option>
                <option value="inactive">Inactive — hidden</option>
              </select>
            </Field>
          </div>
        )}
      </Section>

      <Section title="Photos" step="4">
        <ImageUploader
          files={files}
          setFiles={setFiles}
          existing={existing}
          onRemoveExisting={removeExistingImage}
          busy={saving}
        />
        <p className="mt-2 text-xs text-zinc-400">
          JPEG, PNG, WEBP or GIF · up to 5 MB each · up to 6 photos. Add photos{" "}
          {editing ? "now or later" : "right after creating the listing"}.
        </p>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button type="button" onClick={() => router.back()} className="btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {editing ? "Save changes" : "List my laptop"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, step, children }: { title: string; step: string; children: React.ReactNode }) {
  return (
    <section className="card animate-fade-in p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {step}
        </span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ImageUploader({
  files,
  setFiles,
  existing,
  onRemoveExisting,
  busy,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  existing: Laptop["images"];
  onRemoveExisting: (id: number) => void;
  busy: boolean;
}) {
  const [drag, setDrag] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).slice(0, 6 - existing.length - files.length);
    setFiles((prev) => [...prev, ...next]);
  };

  const total = existing.length + files.length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed p-6 text-center transition",
        drag
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
          : "border-zinc-300 dark:border-zinc-700"
      )}
    >
      <div className="flex flex-wrap justify-center gap-3">
        {existing.map((img) => (
          <div key={img.id} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Image src={img.url} alt="" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(img.id)}
              disabled={busy}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Image
              src={URL.createObjectURL(file)}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {total === 0 && (
        <div className="py-6">
          <span className="text-3xl">📸</span>
          <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Drag & drop laptop photos, or{" "}
            <button
              type="button"
              onClick={() => document.getElementById("file-input")?.click()}
              className="font-semibold text-brand-600 dark:text-brand-400"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-zinc-400">Clear photos sell 2× faster</p>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {total > 0 && total < 6 && (
        <label
          htmlFor="file-input"
          className="btn-outline mt-4 !inline-flex w-auto cursor-pointer text-xs"
        >
          + Add more photos ({total}/6)
        </label>
      )}
    </div>
  );
}