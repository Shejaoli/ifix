import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ReviewStatus = "all" | "pending" | "approved" | "rejected";

export default function AdminReviews() {
  const [activeFilter, setActiveFilter] = useState<ReviewStatus>("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ reviews: any[]; pendingCount: number }>({
    queryKey: ["/api/admin/reviews", activeFilter],
    queryFn: async () => {
      const params = activeFilter !== "all" ? `?status=${activeFilter}` : "";
      const res = await fetch(`/api/admin/reviews${params}`, { credentials: "include" });
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/reviews/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review updated", description: "Status changed successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update review.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review deleted", description: "The review has been permanently deleted." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" }),
  });

  const reviews = data?.reviews || [];
  const pendingCount = data?.pendingCount || 0;

  const tabs: { label: string; value: ReviewStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Pending</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Customer Reviews
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">
            Moderate and manage customer reviews
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{pendingCount} pending review{pendingCount !== 1 ? "s" : ""} need attention</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">No reviews found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {activeFilter === "pending" ? "All reviews have been moderated." : `No ${activeFilter} reviews yet.`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Product</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Rating</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Review</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any, idx: number) => (
                  <tr
                    key={review.id}
                    className={cn(
                      "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/10",
                      idx % 2 === 0 ? "bg-card" : "bg-muted/5"
                    )}
                  >
                    <td className="px-4 py-4 max-w-[160px]">
                      <p className="text-xs font-bold text-foreground line-clamp-2">{review.productName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">{review.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                        ))}
                        <span className="ml-1 text-[10px] font-bold text-muted-foreground">{review.rating}/5</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[280px]">
                      <p className="text-xs text-muted-foreground line-clamp-2">{review.reviewText}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(review.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {review.status !== "approved" && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white border-none gap-1"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: "approved" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${review.id}`}
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[10px] font-bold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: "rejected" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${review.id}`}
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        )}
                        {review.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: "pending" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Clock className="h-3 w-3" /> Reset
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Permanently delete this review?")) deleteMutation.mutate(review.id);
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-review-${review.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
