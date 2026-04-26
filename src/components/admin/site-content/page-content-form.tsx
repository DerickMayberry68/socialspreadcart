"use client";

import * as React from "react";
import { compressUpload } from "@/lib/image-compression";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { HandledErrorAlert } from "@/components/ui/handled-error-alert";
import type {
  MarketingPageContentByKey,
  MarketingPageKey,
} from "@/lib/types/site-content";

export type EditableValue =
  | string
  | number
  | boolean
  | null
  | EditableValue[]
  | { [key: string]: EditableValue };

type PageContentResponse<TKey extends MarketingPageKey> = {
  ok: boolean;
  content?: MarketingPageContentByKey[TKey];
  message?: string;
};

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";
const textareaClass = `${inputClass} min-h-28 resize-y`;

function labelize(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeEmptyLike(value: EditableValue): EditableValue {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, makeEmptyLike(entry)]),
    );
  }
  return "";
}

function setAtPath(
  value: EditableValue,
  path: Array<string | number>,
  nextValue: EditableValue,
): EditableValue {
  if (path.length === 0) return nextValue;

  const [head, ...rest] = path;
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      index === head ? setAtPath(item, rest, nextValue) : item,
    );
  }

  if (value && typeof value === "object") {
    return {
      ...value,
      [head]: setAtPath(value[String(head)], rest, nextValue),
    };
  }

  return value;
}

function addArrayItem(value: EditableValue, path: Array<string | number>) {
  const update = (current: EditableValue, remaining: Array<string | number>): EditableValue => {
    if (remaining.length === 0 && Array.isArray(current)) {
      const template = current[0] ?? "";
      return [...current, makeEmptyLike(template)];
    }

    const [head, ...rest] = remaining;
    if (Array.isArray(current)) {
      return current.map((item, index) =>
        index === head ? update(item, rest) : item,
      );
    }

    if (current && typeof current === "object") {
      return {
        ...current,
        [head]: update(current[String(head)], rest),
      };
    }

    return current;
  };

  return update(value, path);
}

function removeArrayItem(
  value: EditableValue,
  path: Array<string | number>,
  removeIndex: number,
) {
  const update = (current: EditableValue, remaining: Array<string | number>): EditableValue => {
    if (remaining.length === 0 && Array.isArray(current)) {
      return current.filter((_, index) => index !== removeIndex);
    }

    const [head, ...rest] = remaining;
    if (Array.isArray(current)) {
      return current.map((item, index) =>
        index === head ? update(item, rest) : item,
      );
    }

    if (current && typeof current === "object") {
      return {
        ...current,
        [head]: update(current[String(head)], rest),
      };
    }

    return current;
  };

  return update(value, path);
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

type UploadJson = {
  ok?: boolean;
  imageUrl?: string;
  message?: string;
};

function ImageUrlField({
  name,
  stringValue,
  path,
  pageKey,
  onChange,
}: {
  name: string;
  stringValue: string;
  path: Array<string | number>;
  pageKey: MarketingPageKey;
  onChange: (path: Array<string | number>, value: EditableValue) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const compressedFile = await compressUpload(file);
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("pageKey", pageKey);

    try {
      const response = await fetch("/api/admin/site-content/page-content/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const result = await readJsonResponse<UploadJson>(response);

      if (!response.ok || !result?.ok || !result.imageUrl) {
        toast.error(
          result?.message ??
            `Upload failed (${response.status}). Check storage configuration and try again.`,
        );
        return;
      }

      onChange(path, result.imageUrl);
      toast.success("Image URL filled from upload.");
    } catch {
      toast.error("Could not reach the upload endpoint.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label className="space-y-2">
      <span className={labelClass}>{labelize(name)}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          value={stringValue}
          onChange={(e) => onChange(path, e.target.value)}
          className={`${inputClass} min-w-0 sm:flex-1`}
          placeholder="https://… or upload an image"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-sage/20 bg-[#fcf8f1] px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-sage transition hover:border-sage/40 hover:bg-sage-50 disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {uploading ? "Uploading…" : "Choose image"}
        </button>
      </div>
    </label>
  );
}

export function FieldEditor({
  name,
  value,
  path,
  pageKey,
  onChange,
  onAddItem,
  onRemoveItem,
}: {
  name: string;
  value: EditableValue;
  path: Array<string | number>;
  pageKey: MarketingPageKey;
  onChange: (path: Array<string | number>, value: EditableValue) => void;
  onAddItem: (path: Array<string | number>) => void;
  onRemoveItem: (path: Array<string | number>, index: number) => void;
}) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3 rounded-[22px] border border-sage/10 bg-[#fcf8f1] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className={labelClass}>{labelize(name)}</span>
          <button
            type="button"
            className="rounded-full border border-sage/20 px-3 py-1 text-xs uppercase tracking-[0.12em] text-sage"
            onClick={() => onAddItem(path)}
          >
            Add
          </button>
        </div>
        <div className="space-y-4">
          {value.map((item, index) => (
            <div key={index} className="rounded-[18px] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.16em] text-ink/45">
                  {labelize(name)} {index + 1}
                </p>
                {value.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.12em] text-[#a15e50]"
                    onClick={() => onRemoveItem(path, index)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <FieldEditor
                name={`${name}_${index + 1}`}
                value={item}
                path={[...path, index]}
                pageKey={pageKey}
                onChange={onChange}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="grid gap-4 rounded-[22px] border border-sage/10 bg-[#fcf8f1] p-4">
        <legend className={labelClass}>{labelize(name)}</legend>
        {Object.entries(value).map(([key, entry]) => (
          <FieldEditor
            key={key}
            name={key}
            value={entry}
            path={[...path, key]}
            pageKey={pageKey}
            onChange={onChange}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </fieldset>
    );
  }

  const stringValue = value == null ? "" : String(value);
  const isLong =
    stringValue.length > 90 ||
    /body|description|title|highlights|steps|points|footer_description/.test(name);
  const isUrl = /url|target|href/.test(name);

  if (name === "image_url") {
    return (
      <ImageUrlField
        name={name}
        stringValue={stringValue}
        path={path}
        pageKey={pageKey}
        onChange={onChange}
      />
    );
  }

  return (
    <label className="space-y-2">
      <span className={labelClass}>{labelize(name)}</span>
      {isLong && !isUrl ? (
        <textarea
          value={stringValue}
          onChange={(event) => onChange(path, event.target.value)}
          className={textareaClass}
        />
      ) : (
        <input
          value={stringValue}
          onChange={(event) => onChange(path, event.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
}

export function PageContentForm<TKey extends MarketingPageKey>({
  pageKey,
  title,
  description,
  initial,
  floatingSaveButton = true,
  children,
}: {
  pageKey: TKey;
  title: string;
  description: string;
  initial: MarketingPageContentByKey[TKey];
  floatingSaveButton?: boolean;
  children?: ((props: {
    form: EditableValue;
    update: (path: Array<string | number>, value: EditableValue) => void;
    addItem: (path: Array<string | number>) => void;
    removeItem: (path: Array<string | number>, index: number) => void;
  }) => React.ReactNode);
}) {
  const [form, setForm] = React.useState<EditableValue>(() =>
    cloneValue(initial) as EditableValue,
  );
  const [saving, setSaving] = React.useState(false);
  const [handledError, setHandledError] = React.useState<{
    title: string;
    message: string;
  } | null>(null);

  const update = React.useCallback(
    (path: Array<string | number>, value: EditableValue) => {
      setForm((current) => setAtPath(current, path, value));
    },
    [],
  );

  const addItem = React.useCallback((path: Array<string | number>) => {
    setForm((current) => addArrayItem(current, path));
  }, []);

  const removeItem = React.useCallback(
    (path: Array<string | number>, index: number) => {
      setForm((current) => removeArrayItem(current, path, index));
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/site-content/page-content/${pageKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: form }),
        credentials: "same-origin",
      });

      const result = await readJsonResponse<PageContentResponse<TKey>>(response);

      if (!response.ok || !result?.ok || !result.content) {
        setHandledError({
          title: "Page content save failed",
          message:
            result?.message ??
            `Failed to save page content. Please refresh and try again. (${response.status})`,
        });
        return;
      }

      setForm(cloneValue(result.content) as EditableValue);
      toast.success(`${title} updated. Public pages will refresh.`);
    } catch {
      setHandledError({
        title: "Page content save unavailable",
        message:
          "Could not reach the page content save endpoint. Please refresh the admin page and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <HandledErrorAlert
        open={handledError !== null}
        title={handledError?.title}
        message={handledError?.message ?? ""}
        onOpenChange={(open) => {
          if (!open) setHandledError(null);
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
            Page content
          </p>
          <h2 className="mt-3 font-heading text-3xl text-[#284237]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            {description}
          </p>
        </div>

        {children ? (
          children({ form, update, addItem, removeItem })
        ) : (
          <FieldEditor
            name={pageKey}
            value={form}
            path={[]}
            pageKey={pageKey}
            onChange={update}
            onAddItem={addItem}
            onRemoveItem={removeItem}
          />
        )}

        <p className="text-xs leading-5 text-ink/50">
          Link fields accept site paths that start with <code>/</code>,{" "}
          <code>tel:</code>, <code>mailto:</code>, or full{" "}
          <code>https://</code> URLs. For <strong>Image url</strong> rows, use{" "}
          <strong>Choose image</strong> to upload to storage and fill the URL,
          or paste a URL manually. Add descriptive alt text on the next field
          for accessibility.
        </p>

        <div className={floatingSaveButton ? "" : "flex justify-end pt-2"}>
          <button
            type="submit"
            disabled={saving}
            className={
              floatingSaveButton
                ? "fixed bottom-8 right-8 z-50 rounded-full bg-sage px-8 py-4 text-xs font-medium uppercase tracking-[0.15em] text-cream shadow-xl transition hover:-translate-y-1 hover:bg-sage-700 hover:shadow-2xl disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xl"
                : "rounded-full bg-sage px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
            }
          >
            {saving ? "Saving..." : "Save content"}
          </button>
        </div>
      </form>
    </>
  );
}
