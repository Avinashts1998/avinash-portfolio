import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Type, Layout, Upload, MapPin, Tag, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { FieldNote, FieldNoteType } from "../../types/fieldNotes";
import { fieldNotesService } from "../../services/fieldNotesService";
import { uploadImageToCloudinary } from "../../utils/cloudinary";

interface CreateFieldNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated?: (note: FieldNote) => void;
  initialType?: FieldNoteType;
}

export const CreateFieldNoteModal: React.FC<CreateFieldNoteModalProps> = ({
  isOpen,
  onClose,
  onNoteCreated,
  initialType = "text",
}) => {
  const [type, setType] = useState<FieldNoteType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  );
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim() && !imagePreview.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let finalImageUrl: string | undefined = imageUrl.trim() || undefined;

      // If user uploaded a local image file, upload to Cloudinary for reliable URL storage in Firestore
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToCloudinary(imageFile, "field_notes");
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed, checking local preview fallback:", uploadErr);
          if (imagePreview && imagePreview.length < 500000) {
            finalImageUrl = imagePreview;
          } else {
            throw new Error("Failed to upload image. Please try a smaller image or image URL.");
          }
        }
      } else if (imagePreview && !finalImageUrl) {
        finalImageUrl = imagePreview;
      }

      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const newNote = await fieldNotesService.addNote({
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        date: date.trim() || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        location: type === "photo" && location.trim() ? location.trim() : undefined,
        imageUrl: (type === "photo" || type === "design") ? finalImageUrl : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      // Reset form
      setTitle("");
      setContent("");
      setLocation("");
      setTagsInput("");
      setImageUrl("");
      setImagePreview("");
      setImageFile(null);
      setErrorMsg(null);

      if (onNoteCreated) {
        onNoteCreated(newNote);
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to create note:", err);
      setErrorMsg(err?.message || "Failed to save note to Firebase collection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayImage = imageUrl.trim() || imagePreview;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[840px] bg-[var(--bg)] border border-[var(--line)] rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden my-auto flex flex-col z-10"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)] bg-[var(--bg)] shrink-0 z-20">
          <div>
            <h3 className="font-hero font-bold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
              Add to Field Notes
            </h3>
            <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
              Capture a thought, photograph, or design observation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body: Simple, Minimal, Clean Writing Canvas */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6">
            
            {/* Error banner if save fails */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Note Type Selector: Minimal pill toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setType("photo")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                  type === "photo"
                    ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                }`}
              >
                <ImageIcon size={14} />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setType("text")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                  type === "text"
                    ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Type size={14} />
                <span>Thought / Quote</span>
              </button>
              <button
                type="button"
                onClick={() => setType("design")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                  type === "design"
                    ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Layout size={14} />
                <span>Design Note</span>
              </button>
            </div>

            {/* Minimal Writing Canvas */}
            <div className="space-y-4 pt-2">
              {/* Optional Title (For Design/Thought) */}
              {(type === "design" || type === "text") && (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title / Observation (Optional)"
                  className="w-full bg-transparent text-xl sm:text-2xl font-hero font-bold text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none tracking-tight"
                />
              )}

              {/* Main Content / Thought Area */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={type === "text" ? 7 : 5}
                placeholder={
                  type === "text"
                    ? "Write your thought, reflection, or quote here..."
                    : type === "photo"
                    ? "Add a caption or story behind this photograph..."
                    : "Analyze the interaction physics, ergonomics, or UI system contract..."
                }
                className={`w-full bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none resize-none leading-relaxed ${
                  type === "text"
                    ? "text-lg sm:text-xl font-serif italic"
                    : "text-sm sm:text-base font-sans"
                }`}
              />

              {/* Photo Upload Area (Minimal) */}
              {(type === "photo" || type === "design") && (
                <div className="pt-2">
                  {displayImage ? (
                    <div className="relative w-full max-h-[300px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-zinc-900 border border-[var(--line)] group">
                      <img
                        src={displayImage}
                        alt="Preview"
                        className="w-full h-full max-h-[300px] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setImagePreview("");
                          setImageFile(null);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border border-dashed border-[var(--line)] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 transition-all text-[var(--ink-soft)]"
                    >
                      <Upload size={20} className="text-[var(--muted)]" />
                      <span className="text-xs font-sans font-medium">Click to upload photo or drag &amp; drop</span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">PNG, JPG, WEBP up to 10MB</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Metadata Inputs (Location, Date, Tags) - Minimal inline strip */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[var(--line)]/60">
                {/* Location (if photo) */}
                {type === "photo" ? (
                  <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-soft)]">
                    <MapPin size={14} className="text-[var(--muted)] shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (e.g. Dubai, UAE)"
                      className="w-full bg-transparent focus:outline-none text-[var(--ink)] placeholder:text-[var(--muted)]/50 text-xs"
                    />
                  </div>
                ) : <div />}

                {/* Date */}
                <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-soft)]">
                  <Calendar size={14} className="text-[var(--muted)] shrink-0" />
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-mono"
                  />
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-soft)]">
                  <Tag size={14} className="text-[var(--muted)] shrink-0" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags (comma-separated)"
                    className="w-full bg-transparent focus:outline-none text-[var(--ink)] placeholder:text-[var(--muted)]/50 text-xs"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Minimal Bottom Action Bar */}
          <div className="px-6 sm:px-10 py-4 border-t border-[var(--line)] bg-[var(--bg)] shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !imageUrl.trim() && !imagePreview.trim())}
              className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span>{isSubmitting ? "Publishing to Firebase..." : "Publish Note"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
