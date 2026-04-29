"use client";

import * as React from "react";
import { compressUpload } from "@/lib/image-compression";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HandledErrorAlert } from "@/components/ui/handled-error-alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import type {
  GalleryImage,
  GalleryPageContent,
  GallerySectionContent,
} from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";
const textareaClass = `${inputClass} resize-none`;

type SectionFormState = Pick<
  GallerySectionContent,
  | "eyebrow"
  | "title"
  | "description"
  | "feature_card_eyebrow"
  | "feature_card_title"
  | "support_card_body"
>;

type ImageFormState = {
  id?: string;
  display_order: number;
  title: string;
  eyebrow: string;
  alt_text: string;
  image_url: string;
  storage_path: string | null;
  is_active: boolean;
};

function toSectionForm(section: GallerySectionContent): SectionFormState {
  return {
    eyebrow: section.eyebrow,
    title: section.title,
    description: section.description,
    feature_card_eyebrow: section.feature_card_eyebrow,
    feature_card_title: section.feature_card_title,
    support_card_body: section.support_card_body,
  };
}

function toImageForm(image: GalleryImage): ImageFormState {
  return {
    id: image.id,
    display_order: image.display_order,
    title: image.title,
    eyebrow: image.eyebrow,
    alt_text: image.alt_text,
    image_url: image.image_url,
    storage_path: image.storage_path,
    is_active: image.is_active,
  };
}

function normalizeImages(images: ImageFormState[]) {
  return images.map((image, index) => ({
    ...image,
    display_order: index + 1,
    is_active: true,
  }));
}

function serializeGalleryForm(
  section: SectionFormState,
  images: ImageFormState[],
): string {
  const normalized = normalizeImages(images);
  return JSON.stringify({
    section,
    images: normalized.map((img) => ({
      title: img.title,
      eyebrow: img.eyebrow,
      alt_text: img.alt_text,
      image_url: img.image_url,
      storage_path: img.storage_path,
    })),
  });
}

type GalleryUploadResponse = {
  ok: boolean;
  imageUrl?: string;
  path?: string;
  message?: string;
};

type GallerySaveResponse = {
  ok: boolean;
  section?: GallerySectionContent;
  images?: GalleryImage[];
  message?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function historyTopIsGalleryGuard(): boolean {
  const state = window.history.state;
  return (
    typeof state === "object" &&
    state !== null &&
    (state as { __galleryUnsavedGuard?: boolean }).__galleryUnsavedGuard ===
      true
  );
}

export function GalleryManager({ initial }: { initial: GalleryPageContent }) {
  const router = useRouter();
  const pendingNavigationRef = React.useRef<string | null>(null);
  const leaveViaHistoryBackRef = React.useRef(false);
  const historyGuardPushedRef = React.useRef(false);
  const isDiscardingHistoryGuardRef = React.useRef(false);
  const isConfirmingLeaveRef = React.useRef(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = React.useState(false);

  const [section, setSection] = React.useState<SectionFormState>(() =>
    toSectionForm(initial.section),
  );
  const [images, setImages] = React.useState<ImageFormState[]>(() =>
    normalizeImages(initial.images.map(toImageForm)),
  );
  const [baseline, setBaseline] = React.useState(() =>
    serializeGalleryForm(
      toSectionForm(initial.section),
      normalizeImages(initial.images.map(toImageForm)),
    ),
  );
  const [saving, setSaving] = React.useState(false);
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(
    null,
  );
  const [handledError, setHandledError] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const [removeImageIndex, setRemoveImageIndex] = React.useState<number | null>(
    null,
  );
  const fileInputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const isDirty = serializeGalleryForm(section, images) !== baseline;
  const isDirtyRef = React.useRef(isDirty);
  isDirtyRef.current = isDirty;

  React.useEffect(() => {
    if (isDirty) {
      if (!historyGuardPushedRef.current) {
        if (historyTopIsGalleryGuard()) {
          historyGuardPushedRef.current = true;
        } else {
          historyGuardPushedRef.current = true;
          window.history.pushState(
            { __galleryUnsavedGuard: true },
            "",
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
          );
        }
      }
    } else if (historyGuardPushedRef.current) {
      if (historyTopIsGalleryGuard()) {
        isDiscardingHistoryGuardRef.current = true;
        historyGuardPushedRef.current = false;
        window.history.back();
        queueMicrotask(() => {
          isDiscardingHistoryGuardRef.current = false;
        });
      } else {
        historyGuardPushedRef.current = false;
      }
    }
  }, [isDirty]);

  React.useEffect(() => {
    const onPopState = () => {
      if (isDiscardingHistoryGuardRef.current) return;
      if (!isDirtyRef.current) return;

      historyGuardPushedRef.current = false;
      pendingNavigationRef.current = null;
      leaveViaHistoryBackRef.current = true;
      setUnsavedDialogOpen(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  React.useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  React.useEffect(() => {
    if (!isDirty) return;

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;

      event.preventDefault();
      event.stopPropagation();
      leaveViaHistoryBackRef.current = false;
      pendingNavigationRef.current = next;
      setUnsavedDialogOpen(true);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [isDirty]);

  const updateSection = (key: keyof SectionFormState, value: string) => {
    setSection((current) => ({ ...current, [key]: value }));
  };

  const showHandledError = (title: string, message: string) => {
    setHandledError({ title, message });
  };

  const updateImage = (
    index: number,
    key: keyof Omit<ImageFormState, "display_order" | "is_active">,
    value: string | null,
  ) => {
    setImages((current) => {
      const next = [...current];
      next[index] = { ...next[index], [key]: value };
      return normalizeImages(next);
    });
  };

  const addImage = () => {
    setImages((current) =>
      normalizeImages([
        ...current,
        {
          display_order: current.length + 1,
          title: "",
          eyebrow: "",
          alt_text: "",
          image_url: "",
          storage_path: null,
          is_active: true,
        },
      ]),
    );
  };

  const requestRemoveImage = (index: number) => {
    setRemoveImageIndex(index);
  };

  const confirmRemoveImage = () => {
    if (removeImageIndex === null) return;
    const index = removeImageIndex;
    setImages((current) => normalizeImages(current.filter((_, i) => i !== index)));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeImages(next);
    });
  };

  const handleFileSelect = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const compressedFile = await compressUpload(file);
    const formData = new FormData();
    formData.append("file", compressedFile);

    try {
      const response = await fetch("/api/admin/site-content/gallery/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const result = await readJsonResponse<GalleryUploadResponse>(response);

      if (!response.ok || !result?.ok || !result.imageUrl) {
        showHandledError(
          "Image upload failed",
          result?.message ??
            `Failed to upload image. Please refresh and try again. (${response.status})`,
        );
        return;
      }

      updateImage(index, "image_url", result.imageUrl);
      updateImage(index, "storage_path", result.path ?? null);
      toast.success("Image uploaded.");
    } catch {
      showHandledError(
        "Image upload unavailable",
        "Could not reach the gallery upload endpoint. Please refresh and try again.",
      );
    } finally {
      setUploadingIndex(null);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/site-content/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, images: normalizeImages(images) }),
        credentials: "same-origin",
      });
      const result = await readJsonResponse<GallerySaveResponse>(response);

      if (!response.ok || !result?.ok || !result.section || !result.images) {
        showHandledError(
          "Gallery save failed",
          result?.message ??
            `Failed to update gallery content. Please refresh and try again. (${response.status})`,
        );
        return;
      }

      const nextSection = toSectionForm(result.section);
      const nextImages = normalizeImages(result.images.map(toImageForm));
      setSection(nextSection);
      setImages(nextImages);
      setBaseline(serializeGalleryForm(nextSection, nextImages));
      toast.success("Gallery content updated. Public gallery will refresh.");
    } catch {
      showHandledError(
        "Gallery save unavailable",
        "Could not reach the gallery save endpoint. Please refresh the admin page and try again.",
      );
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
      <ConfirmDialog
        open={removeImageIndex !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveImageIndex(null);
        }}
        title="Remove gallery image?"
        description={
          removeImageIndex !== null
            ? `Remove ${
                images[removeImageIndex]?.title
                  ? `"${images[removeImageIndex].title}"`
                  : "this image"
              } from the gallery?`
            : "Remove this image from the gallery?"
        }
        cancelLabel="Keep image"
        confirmLabel="Remove"
        onConfirm={confirmRemoveImage}
      />
      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          setUnsavedDialogOpen(open);
          if (!open) {
            if (isConfirmingLeaveRef.current) {
              isConfirmingLeaveRef.current = false;
              pendingNavigationRef.current = null;
              leaveViaHistoryBackRef.current = false;
              historyGuardPushedRef.current = false;
              return;
            }

            pendingNavigationRef.current = null;
            leaveViaHistoryBackRef.current = false;

            queueMicrotask(() => {
              if (!isDirtyRef.current) return;
              if (historyGuardPushedRef.current) return;
              if (historyTopIsGalleryGuard()) {
                historyGuardPushedRef.current = true;
                return;
              }
              historyGuardPushedRef.current = true;
              window.history.pushState(
                { __galleryUnsavedGuard: true },
                "",
                `${window.location.pathname}${window.location.search}${window.location.hash}`,
              );
            });
          }
        }}
        title="Leave gallery editor?"
        description="You have unsaved gallery changes. Save first, or leave and lose those edits."
        onLeave={() => {
          isConfirmingLeaveRef.current = true;
          const href = pendingNavigationRef.current;
          const viaBack = leaveViaHistoryBackRef.current;
          pendingNavigationRef.current = null;
          leaveViaHistoryBackRef.current = false;

          if (href) {
            router.push(href);
            return;
          }

          if (viaBack) {
            router.back();
          }
        }}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
          Gallery copy
        </p>
        <h2 className="mt-3 font-heading text-3xl text-[#284237]">
          Gallery page text.
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClass}>Eyebrow (0-40 chars)</span>
            <input
              maxLength={40}
              value={section.eyebrow}
              onChange={(e) => updateSection("eyebrow", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Title (1-180 chars)</span>
            <input
              maxLength={180}
              value={section.title}
              onChange={(e) => updateSection("title", e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className={labelClass}>Description (1-500 chars)</span>
            <textarea
              rows={3}
              maxLength={500}
              value={section.description}
              onChange={(e) => updateSection("description", e.target.value)}
              required
              className={textareaClass}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Feature eyebrow (0-60 chars)</span>
            <input
              maxLength={60}
              value={section.feature_card_eyebrow}
              onChange={(e) =>
                updateSection("feature_card_eyebrow", e.target.value)
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Feature title (1-220 chars)</span>
            <input
              maxLength={220}
              value={section.feature_card_title}
              onChange={(e) =>
                updateSection("feature_card_title", e.target.value)
              }
              required
              className={inputClass}
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className={labelClass}>Support copy (1-320 chars)</span>
            <textarea
              rows={3}
              maxLength={320}
              value={section.support_card_body}
              onChange={(e) =>
                updateSection("support_card_body", e.target.value)
              }
              required
              className={textareaClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
              Gallery images
            </p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Gallery images shown on your site.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
              Add images, write accessible descriptions, and use the arrow
              controls to set the display order.
            </p>
          </div>
          <button
            type="button"
            onClick={addImage}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/20 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-sage transition hover:border-sage/40 hover:bg-sage-50"
          >
            <Plus className="h-4 w-4" />
            Add image
          </button>
        </div>

        {images.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-sage/20 bg-[#fffaf4] p-8 text-center text-sm leading-6 text-ink/60">
            No gallery images are currently selected. Saving this state will
            leave the public gallery without image tiles.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {images.map((image, index) => (
              <div
                key={image.id ?? `new-${index}`}
                className="space-y-4 rounded-[24px] border border-sage/10 bg-[#fffaf4] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#ad7a54]">
                    Image {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          className="rounded-full border border-sage/15 p-2 text-ink/55 transition hover:border-sage/35 hover:text-sage disabled:opacity-35"
                          aria-label="Move image up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Move earlier in display order</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          className="rounded-full border border-sage/15 p-2 text-ink/55 transition hover:border-sage/35 hover:text-sage disabled:opacity-35"
                          aria-label="Move image down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Move later in display order</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => requestRemoveImage(index)}
                          className="rounded-full border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove from gallery</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {image.image_url ? (
                  <div className="overflow-hidden rounded-[20px] border border-sage/10 bg-white">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={image.image_url}
                        alt={image.alt_text || image.title || "Gallery image"}
                        fill
                        sizes="(max-width: 1280px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] border border-dashed border-sage/20 bg-white text-xs uppercase tracking-[0.2em] text-ink/45">
                    No image yet
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  disabled={uploadingIndex !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sage/20 bg-white px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploadingIndex === index ? "Uploading..." : "Upload image"}
                </button>
                <input
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(index, e)}
                  className="hidden"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className={labelClass}>Image URL</span>
                    <input
                      value={image.image_url}
                      onChange={(e) =>
                        updateImage(index, "image_url", e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Eyebrow (0-60 chars)</span>
                    <input
                      maxLength={60}
                      value={image.eyebrow}
                      onChange={(e) =>
                        updateImage(index, "eyebrow", e.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Title (1-140 chars)</span>
                    <input
                      maxLength={140}
                      value={image.title}
                      onChange={(e) =>
                        updateImage(index, "title", e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className={labelClass}>Alt text (1-180 chars)</span>
                    <textarea
                      rows={2}
                      maxLength={180}
                      value={image.alt_text}
                      onChange={(e) =>
                        updateImage(index, "alt_text", e.target.value)
                      }
                      required
                      className={textareaClass}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="">
        <button
          type="submit"
          disabled={saving || uploadingIndex !== null}
          className="fixed bottom-8 right-8 z-50 rounded-full bg-sage px-8 py-4 text-xs font-medium uppercase tracking-[0.15em] text-cream shadow-xl transition hover:-translate-y-1 hover:bg-sage-700 hover:shadow-2xl disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xl"
        >
          {saving ? "Saving..." : "Save gallery content"}
        </button>
      </div>
      </form>
    </>
  );
}
