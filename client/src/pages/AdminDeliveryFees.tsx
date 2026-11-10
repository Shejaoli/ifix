import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeliveryFee } from "@shared/schema";
import { Truck, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);

export default function AdminDeliveryFees() {
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: fees = [], isLoading } = useQuery<DeliveryFee[]>({
    queryKey: ["/api/delivery-fees"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ sector, fee }: { sector: string; fee: number }) =>
      apiRequest("PATCH", `/api/admin/delivery-fees/${encodeURIComponent(sector)}`, { fee }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-fees"] });
      toast({ title: `${variables.sector} fee updated` });
      setEdits((e) => {
        const next = { ...e };
        delete next[variables.sector];
        return next;
      });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const grouped = fees.reduce<Record<string, DeliveryFee[]>>((acc, f) => {
    (acc[f.district] ||= []).push(f);
    return acc;
  }, {});

  const handleSave = (sector: string) => {
    const value = edits[sector];
    if (value === undefined) return;
    const fee = Number(value);
    if (!Number.isInteger(fee) || fee < 0) {
      toast({ title: "Fee must be a non-negative whole number", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ sector, fee });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Delivery Fees
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Sector-based delivery fees for Kigali, added automatically at checkout
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Districts", value: Object.keys(grouped).length, color: "text-teal-700 bg-teal-50" },
          { label: "Sectors", value: fees.length, color: "text-green-600 bg-green-50" },
          {
            label: "Avg Fee",
            value: fees.length ? fmt(Math.round(fees.reduce((s, f) => s + f.fee, 0) / fees.length)) : fmt(0),
            color: "text-orange-600 bg-orange-50",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 border ${s.color.split(" ")[1]} border-current/10`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-lg font-black ${s.color.split(" ")[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-sm text-gray-400">Loading delivery fees…</div>
      ) : fees.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          No delivery fees found. Run the database migration to seed the 35 Kigali sectors.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([district, sectors]) => (
            <div key={district} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">{district}</span>
                <span className="text-[10px] text-gray-400">({sectors.length} sectors)</span>
              </div>
              <div className="divide-y divide-gray-100">
                {sectors.map((f) => {
                  const editValue = edits[f.sector];
                  const isDirty = editValue !== undefined && Number(editValue) !== f.fee;
                  return (
                    <div key={f.sector} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm font-bold text-gray-700 truncate">{f.sector}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={editValue !== undefined ? editValue : f.fee}
                            onChange={(e) =>
                              setEdits((prev) => ({ ...prev, [f.sector]: e.target.value }))
                            }
                            className="w-28 h-8 text-xs text-right pr-10 font-mono font-bold"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
                            RWF
                          </span>
                        </div>
                        <button
                          onClick={() => handleSave(f.sector)}
                          disabled={!isDirty || updateMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-300 enabled:text-primary disabled:opacity-40 transition-colors"
                          title="Save"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
