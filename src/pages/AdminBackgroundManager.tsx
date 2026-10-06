import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Eye, 
  Sparkles, 
  Pencil,
  MapPin,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
  X
} from "lucide-react";
import { 
  aboutBackgroundService, 
  BackgroundItem, 
  AboutBackgroundMultiConfig,
} from "../services/aboutBackgroundService";
import AboutBackgroundViewer from "../components/about/AboutBackgroundViewer";
import CreateInsightModal from "../components/admin/CreateInsightModal";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import { isAdminAuthenticated } from "../utils/auth";

export default function AdminBackgroundManager() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  const [config, setConfig] = useState<AboutBackgroundMultiConfig>(() => aboutBackgroundService.getMultiConfig());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewActiveId, setPreviewActiveId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: "success" | "error" } | null>(null);

  // Insight Wizard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BackgroundItem | null>(null);

  // Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<BackgroundItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio Playback Preview State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggleAudio = (e: React.MouseEvent, item: BackgroundItem) => {
    e.stopPropagation();
    if (!item.audioUrl) return;

    if (playingAudioId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        const audio = new Audio(item.audioUrl);
        audio.volume = 0.8;
        audio.onended = () => {
          setPlayingAudioId(null);
        };
        audio.onerror = () => {
          setPlayingAudioId(null);
          showToast("Could not play audio track", "error");
        };
        audio.play().then(() => {
          setPlayingAudioId(item.id);
        }).catch((err) => {
          console.warn("Audio playback prevented:", err);
          setPlayingAudioId(null);
        });
        audioRef.current = audio;
      } catch (err) {
        console.error("Audio playback error:", err);
        setPlayingAudioId(null);
      }
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(aboutBackgroundService.getMultiConfig());
    };
    window.addEventListener("portfolio_about_background_update", handleUpdate);
    return () => window.removeEventListener("portfolio_about_background_update", handleUpdate);
  }, []);

  // Open modal for creating a new scene
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing scene
  const handleOpenEditModal = (item: BackgroundItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Modal Success Handler
  const handleModalSuccess = (item: BackgroundItem) => {
    setConfig(aboutBackgroundService.getMultiConfig());
    showToast(editingItem ? `Updated "${item.title || "Scene"}" successfully!` : `Created "${item.title || "Scene"}" successfully!`);
  };

  // Set active background for default about page view
  const handleSetActive = async (id: string) => {
    await aboutBackgroundService.setActiveBackground(id);
    setConfig(aboutBackgroundService.getMultiConfig());
    showToast("Set active background scene for the About page.");
  };

  // Open in-app Delete Confirmation Modal
  const handleDelete = (item: BackgroundItem) => {
    setItemToDelete(item);
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await aboutBackgroundService.deleteBackgroundItem(itemToDelete.id);
      setConfig(aboutBackgroundService.getMultiConfig());
      showToast(`Deleted "${itemToDelete.title || "Scene"}" successfully.`);
    } catch (err: any) {
      console.error("Error deleting scene:", err);
      const msg = err?.message || (typeof err === "string" ? err : (err ? JSON.stringify(err) : "Unknown error"));
      showToast("Failed to delete scene: " + msg, "error");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-8 px-4 sm:px-6 w-full max-w-[1150px] mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[110] bg-[var(--card)] border shadow-dropdown px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-sans font-medium animate-in fade-in slide-in-from-top-4 ${
          toastMessage.type === "error" ? "border-red-500/30 text-red-600 dark:text-red-400" : "border-[var(--line)] text-[var(--ink)]"
        }`}>
          {toastMessage.type === "error" ? (
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
          ) : (
            <Sparkles size={16} className="text-[var(--blue)] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-[var(--ink)] font-sans text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent select-none whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            <span>Back to Admin</span>
          </Link>
        </div>

        {/* Global Actions - only visible when collection has items */}
        {config.items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPreviewActiveId(config.activeId || config.items[0]?.id);
                setPreviewOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Eye size={14} className="text-[var(--blue)]" />
              <span>Preview All</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4.5 py-2 rounded-xl text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Add Scene</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div>
        {config.items.length === 0 ? (
          <div className="min-h-[58vh] flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-hero font-bold tracking-tight text-[var(--ink)] mb-2">
              Where did your journey take you?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-md mb-6">
              Capture viewpoints, ambient audio recordings, and memorable exploration scenes.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-6 py-3 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create your first Insight</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-hero font-bold tracking-tight text-[var(--ink)]">Manage Insights</h2>
                <p className="text-xs text-[var(--ink-soft)] font-sans">Create, edit, and organize exploration insights and ambient scenes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-[var(--card)] rounded-2xl border border-[var(--line)] transition-all shadow-xs overflow-hidden group hover:border-[var(--ink-soft)]/40 relative aspect-[16/11] sm:aspect-[16/10]"
                >
                  {/* Background Image / Placeholder */}
                  {item.imageUrl ? (
                    <img
                      src={getOptimizedImageUrl(item.imageUrl, 800)}
                      alt={item.title || "Scene"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--ink-soft)] gap-2">
                      <ImageIcon size={28} />
                      <span className="text-xs font-sans">No image uploaded</span>
                    </div>
                  )}

                  {/* Top Right Speaker Sound Button (Click to Play/Pause) */}
                  {item.audioUrl && (
                    <div className="absolute top-3.5 right-3.5 z-20 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => handleToggleAudio(e, item)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
                          playingAudioId === item.id
                            ? "bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-400/50 animate-pulse scale-105"
                            : "bg-black/60 hover:bg-black/85 text-white border border-white/20 hover:scale-105"
                        }`}
                        title={
                          playingAudioId === item.id
                            ? "Click to pause audio"
                            : item.audioLabel
                            ? `Play audio: ${item.audioLabel}`
                            : "Click to play ambient audio"
                        }
                      >
                        {playingAudioId === item.id ? (
                          <VolumeX size={14} className="text-white" />
                        ) : (
                          <Volume2 size={14} className="text-white" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Bottom Side Shadow Overlay (positioned slightly higher with increased readability) */}
                  <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end gap-3 z-10">
                    {/* Title & Metadata */}
                    <div className="space-y-1">
                      <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-white tracking-tight drop-shadow-sm truncate">
                        {item.title || "Untitled Scene"}
                      </h4>
                      <div className="flex items-center gap-2 text-sm sm:text-base text-white/90 font-sans">
                        <MapPin size={15} className="shrink-0 text-white/80" />
                        <span className="truncate">{item.location || "Viewpoint"}</span>
                      </div>
                    </div>

                    {/* Preview, Edit, and Delete Buttons on the Image */}
                    <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/15">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewActiveId(item.id);
                          setPreviewOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold bg-black/50 hover:bg-black/75 text-white border border-white/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                        title="Preview fullscreen scene"
                      >
                        <Eye size={14} className="text-blue-300" />
                        <span>Preview</span>
                      </button>

                      {/* Right Action Icons: Round Edit and Delete Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Round Edit Button with Pen Icon */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/25 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                          title="Edit scene"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* Round Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white border border-red-400/40 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                          title="Delete scene"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Creation & Editing Wizard Modal */}
      <CreateInsightModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleModalSuccess}
        initialData={editingItem}
      />

      {/* Interactive Fullscreen Viewer Preview */}
      <AboutBackgroundViewer
        items={config.items}
        activeId={previewActiveId}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* In-App Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border border-[var(--line)] w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-hero font-bold text-[var(--ink)]">
                  Delete Scene?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans leading-relaxed">
                  Are you sure you want to delete <strong className="text-[var(--ink)] font-semibold">"{itemToDelete.title || "Untitled Scene"}"</strong>? Associated media will also be cleaned up.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Scene</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
