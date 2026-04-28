"use client";

import * as React from "react";
import { compressUpload } from "@/lib/image-compression";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HandledErrorAlert } from "@/components/ui/handled-error-alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  AboutFeatureCard,
  AboutImage,
  AboutPageContent,
  AboutPageContentRecord,
} from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";
const textareaClass = `${inputClass} resize-none`;

type ContentFormState = Pick<
  AboutPageContentRecord,
  | "eyebrow"
  | "title"
  | "description"
  | "story_badge"
  | "story_title"
  | "story_body"
>;

type ImageFormState = {
  id?: string;
  display_order: number;
  image_url: string;
  storage_path: string | null;
  alt_text: string;
  is_active: boolean;
};

type CardFormState = {
  display_order: 1 | 2 | 3;
  title: string;
  body: string;
  icon_key: "heart-handshake" | "sparkles" | "map-pin";
};

type UploadResponse = {
  ok: boolean;
  imageUrl?: string;
  path?: string;
  message?: string;
};

type SaveResponse = {
  ok: boolean;
  content?: AboutPageContentRecord;
  images?: AboutImage[];
  featureCards?: [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard];
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

function toContentForm(content: AboutPageContentRecord): ContentFormState {
  return {
    eyebrow: content.eyebrow,
    title: content.title,
    description: content.description,
    story_badge: content.story_badge,
    story_title: content.story_title,
    story_body: content.story_body,
  };
}

function toImageForm(image: AboutImage): ImageFormState {
  return {
    id: image.id,
    display_order: image.display_order,
    image_url: image.image_url,
    storage_path: image.storage_path,
    alt_text: image.alt_text,
    is_active: image.is_active,
  };
}

function toCardForm(card: AboutFeatureCard): CardFormState {
  return {
    display_order: card.display_order,
    title: card.title,
    body: card.body,
    icon_key: card.icon_key,
  };
}

function normalizeImages(images: ImageFormState[]) {
  return images.map((image, index) => ({
    ...image,
    display_order: index + 1,
    is_active: true,
  }));
}

function normalizeCards(cards: CardFormState[]) {
  return cards
    .slice(0, 3)
    .map((card, index) => ({
      ...card,
      display_order: (index + 1) as 1 | 2 | 3,
    })) as [CardFormState, CardFormState, CardFormState];
}

export function AboutManager({ initial }: { initial: AboutPageContent }) {
  const [content, setContent] = React.useState<ContentFormState>(() =>
    toContentForm(initial.content),
  );
  const [images, setImages] = React.useState<ImageFormState[]>(() =>
    normalizeImages(initial.images.map(toImageForm)),
  );
  const [featureCards, setFeatureCards] = React.useState<
    [CardFormState, CardFormState, CardFormState]
  >(() => normalizeCards(initial.featureCards.map(toCardForm)));
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

  const showHandledError = (title: string, message: string) => {
    setHandledError({ title, message });
  };

  const updateContent = (
    key: Exclude<keyof ContentFormState, "story_body">,
    value: string,
  ) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const updateParagraph = (index: number, value: string) => {
    setContent((current) => {
      const story_body = [...current.story_body];
      story_body[index] = value;
      return { ...current, story_body };
    });
  };

  const addParagraph = () => {
    setContent((current) => {
      if (current.story_body.length >= 4) return current;
      return { ...current, story_body: [...current.story_body, ""] };
    });
  };

  const removeParagraph = (index: number) => {
    setContent((current) => {
      if (current.story_body.length <= 1) return current;
      return {
        ...current,
        story_body: current.story_body.filter((_, i) => i !== index),
      };
    });
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
          image_url: "",
          storage_path: null,
          alt_text: "",
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

  const updateCard = (
    index: number,
    key: keyof Pick<CardFormState, "title" | "body">,
    value: string,
  ) => {
    setFeatureCards((current) => {
      const next = [...current] as [CardFormState, CardFormState, CardFormState];
      next[index] = { ...next[index], [key]: value };
      return normalizeCards(next);
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
      const response = await fetch("/api/admin/site-content/about/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const result = await readJsonResponse<UploadResponse>(response);

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
        "Could not reach the About image upload endpoint. Please refresh and try again.",
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
      const response = await fetch("/api/admin/site-content/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images: normalizeImages(images),
          featureCards: normalizeCards(featureCards),
        }),
        credentials: "same-origin",
      });
      const result = await readJsonResponse<SaveResponse>(response);

      if (
        !response.ok ||
        !result?.ok ||
        !result.content ||
        !result.images ||
        !result.featureCards
      ) {
        showHandledError(
          "About save failed",
          result?.message ??
            `Failed to update About content. Please refresh and try again. (${response.status})`,
        );
        return;
      }

      setContent(toContentForm(result.content));
      setImages(normalizeImages(result.images.map(toImageForm)));
      setFeatureCards(normalizeCards(result.featureCards.map(toCardForm)));
      toast.success("About content updated. Public About page will refresh.");
    } catch {
      showHandledError(
        "About save unavailable",
        "Could not reach the About save endpoint. Please refresh the admin page and try again.",
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
        title="Remove About image?"
        description="Remove this image from the About page?"
        cancelLabel="Keep image"
        confirmLabel="Remove"
        onConfirm={confirmRemoveImage}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
            About copy
          </p>
          <h2 className="mt-3 font-heading text-3xl text-[#284237]">
            Shape the brand story.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Eyebrow (0-40 chars)</span>
              <input
                maxLength={40}
                value={content.eyebrow}
                onChange={(e) => updateContent("eyebrow", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>Story badge (0-60 chars)</span>
              <input
                maxLength={60}
                value={content.story_badge}
                onChange={(e) => updateContent("story_badge", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className={labelClass}>Title (1-220 chars)</span>
              <textarea
                rows={2}
                maxLength={220}
                value={content.title}
                onChange={(e) => updateContent("title", e.target.value)}
                required
                className={textareaClass}
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className={labelClass}>Intro description (1-600 chars)</span>
              <textarea
                rows={3}
                maxLength={600}
                value={content.description}
                onChange={(e) => updateContent("description", e.target.value)}
                required
                className={textareaClass}
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className={labelClass}>Story headline (1-240 chars)</span>
              <textarea
                rows={2}
                maxLength={240}
                value={content.story_title}
                onChange={(e) => updateContent("story_title", e.target.value)}
                required
                className={textareaClass}
              />
            </label>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className={labelClass}>Story paragraphs (1-4)</p>
              <button
                type="button"
                onClick={addParagraph}
                disabled={content.story_body.length >= 4}
                className="inline-flex items-center gap-2 rounded-full border border-sage/20 px-3 py-2 text-xs uppercase tracking-[0.15em] text-sage transition hover:border-sage/40 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add paragraph
              </button>
            </div>
            {content.story_body.map((paragraph, index) => (
              <label key={index} className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.13em] text-ink/35">
                  Paragraph {index + 1}
                </span>
                <div className="flex gap-3">
                  <textarea
                    rows={3}
                    maxLength={700}
                    value={paragraph}
                    onChange={(e) => updateParagraph(index, e.target.value)}
                    required
                    className={textareaClass}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => removeParagraph(index)}
                        disabled={content.story_body.length <= 1}
                        className="self-start rounded-full border border-red-200 p-3 text-red-600 transition hover:bg-red-50 disabled:opacity-35"
                        aria-label="Remove paragraph"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove this paragraph</TooltipContent>
                  </Tooltip>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                About images
              </p>
              <h2 className="mt-3 font-heading text-3xl text-[#284237]">
                Choose the photos on the page.
              </h2>
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
              No About images are selected. The public page will keep the story
              and cards readable without broken image tiles.
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
                        <TooltipContent>Remove from About page</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {image.image_url ? (
                    <div className="overflow-hidden rounded-[20px] border border-sage/10 bg-white">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={image.image_url}
                          alt={image.alt_text || "About page image"}
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

                  <label className="space-y-2">
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
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
            About feature cards
          </p>
          <h2 className="mt-3 font-heading text-3xl text-[#284237]">
            Edit the three value cards.
          </h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {featureCards.map((card, index) => (
              <div
                key={card.display_order}
                className="space-y-4 rounded-[24px] border border-sage/10 bg-[#fffaf4] p-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#ad7a54]">
                  Card {card.display_order}
                </p>
                <label className="space-y-2">
                  <span className={labelClass}>Title (1-80 chars)</span>
                  <input
                    maxLength={80}
                    value={card.title}
                    onChange={(e) => updateCard(index, "title", e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Body (1-220 chars)</span>
                  <textarea
                    rows={4}
                    maxLength={220}
                    value={card.body}
                    onChange={(e) => updateCard(index, "body", e.target.value)}
                    required
                    className={textareaClass}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="">
          <button
            type="submit"
            disabled={saving || uploadingIndex !== null}
            className="fixed bottom-8 right-8 z-50 rounded-full bg-sage px-8 py-4 text-xs font-medium uppercase tracking-[0.15em] text-cream shadow-xl transition hover:-translate-y-1 hover:bg-sage-700 hover:shadow-2xl disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xl"
          >
            {saving ? "Saving..." : "Save About content"}
          </button>
        </div>
      </form>
    </>
  );
}
