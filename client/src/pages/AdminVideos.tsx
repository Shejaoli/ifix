import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Video, Upload, Trash2, Star, Eye, EyeOff,
  Play, Edit2, X, Save, Plus, Film,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminVideos() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", order: 0 });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const { data: videos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/videos"],
    queryFn: async () => {
      const res = await fetch("/api/videos");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/videos/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/videos"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/admin/videos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setEditingId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/videos/${id}`, { [field]: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/videos"] }),
  });

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError("Please select a video file."); return; }
    if (!uploadTitle.trim()) { setUploadError("Please enter a title for the video."); return; }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) { setUploadError("File is too large. Maximum size is 50MB."); return; }

    setUploading(true);
    setUploadError(null);
    setUploadProgress("Uploading video...");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", uploadTitle.trim());
    formData.append("description", uploadDescription.trim());
    formData.append("isFeatured", uploadFeatured ? "true" : "false");

    try {
      const res = await fetch("/api/admin/videos/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      setUploadProgress("Processing...");
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setUploadSuccess(true);
      setUploadTitle("");
      setUploadDescription("");
      setUploadFeatured(false);
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => { setUploadSuccess(false); setShowUploadForm(false); }, 2000);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const startEdit = (video: any) => {
    setEditingId(video.id);
    setEditForm({ title: video.title, description: video.description || "", order: video.order || 0 });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" /> Promo Videos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage videos displayed in the homepage promotion section</p>
        </div>
        {!showUploadForm && (
          <Button onClick={() => setShowUploadForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Upload Video
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-sm font-black">Upload New Video</span>
            </div>
            <button onClick={() => { setShowUploadForm(false); setUploadError(null); setUploadSuccess(false); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* File Drop Zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer p-8"
            >
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" />
              <Video className="h-10 w-10 text-muted-foreground/50 group-hover:text-primary/60 mb-3 transition-colors" />
              <p className="text-sm font-bold text-foreground">Click to select video</p>
              <p className="text-xs text-muted-foreground mt-1">MP4, WebM or OGG · max 50MB</p>
              {fileRef.current?.files?.[0] && (
                <Badge className="mt-3 bg-primary/10 text-primary border-primary/20">
                  {fileRef.current.files[0].name}
                </Badge>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Video Title *</label>
                <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g., IFIX Summer Promo" className="h-10" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Short Description</label>
                <Input value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="e.g., Exclusive tech deals this season" className="h-10" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={uploadFeatured} onCheckedChange={setUploadFeatured} />
              <div>
                <p className="text-sm font-bold">Mark as Featured</p>
                <p className="text-xs text-muted-foreground">Featured videos appear first in the promo section</p>
              </div>
            </div>

            {/* Status */}
            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{uploadError}</p>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-600 font-bold">Video uploaded successfully!</p>
              </div>
            )}
            {uploadProgress && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                <Loader2 className="h-4 w-4 text-primary shrink-0 animate-spin" />
                <p className="text-xs text-primary font-bold">{uploadProgress}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading} className="gap-1.5">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
              <Button variant="outline" onClick={() => { setShowUploadForm(false); setUploadError(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-black">Uploaded Videos</h2>
            <p className="text-xs text-muted-foreground">{videos.length} video{videos.length !== 1 ? "s" : ""} · active videos appear on the homepage</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Film className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No videos yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your first promo video above</p>
            </div>
          ) : videos.map((video: any) => (
            <div key={video.id} className="p-4">
              {editingId === video.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Title</label>
                      <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                      <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-9 text-sm" placeholder="Short promo description" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Display Order</label>
                      <Input type="number" value={editForm.order} onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: video.id, data: editForm })} disabled={updateMutation.isPending} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-4">
                  {/* Video preview thumbnail */}
                  <div
                    className="relative h-16 w-24 rounded-lg overflow-hidden bg-slate-900 border border-border shrink-0 cursor-pointer group"
                    onClick={() => setPreviewId(previewId === video.id ? null : video.id)}
                  >
                    <video src={video.url} className="h-full w-full object-cover" muted preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate">{video.title}</p>
                      {video.isFeatured && <Badge className="text-[9px] h-4 px-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 font-black">Featured</Badge>}
                      {!video.isActive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black text-muted-foreground">Inactive</Badge>}
                    </div>
                    {video.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{video.description}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatBytes(video.fileSize)} · {video.mimeType} · {formatDate(video.createdAt)}
                      {video.isCompressed && " · compressed"}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: video.id, field: "isFeatured", value: !video.isFeatured })}
                      title={video.isFeatured ? "Unfeature" : "Mark as featured"}
                      className={cn("p-1.5 rounded-lg transition-all", video.isFeatured ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10")}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: video.id, field: "isActive", value: !video.isActive })}
                      title={video.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      {video.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => startEdit(video)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${video.title}"?`)) deleteMutation.mutate(video.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Inline preview player */}
              {previewId === video.id && (
                <div className="mt-3 rounded-xl overflow-hidden bg-black border border-border relative">
                  <video src={video.url} controls autoPlay className="w-full max-h-64 object-contain" />
                  <button onClick={() => setPreviewId(null)} className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {videos.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Active videos</strong> appear automatically in the homepage promo section.
            Featured videos are shown first. Up to 2 videos display side by side.
          </p>
        </div>
      )}
    </div>
  );
}
