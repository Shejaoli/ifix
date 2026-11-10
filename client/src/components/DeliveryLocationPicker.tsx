import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin, Navigation, X } from "lucide-react";
import { DISTRICTS_BY_PROVINCE, KIGALI_SECTORS_BY_DISTRICT, PROVINCES, isKigaliDistrict } from "@shared/rwanda-locations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DELIVERY_ADDRESS_STORAGE_KEY, readSavedDeliveryAddress, type DeliveryAddress } from "@/lib/delivery-address";

const KIGALI_CENTER = { latitude: -1.9441, longitude: 30.0619 };

function mapUrl(address: DeliveryAddress) {
  if (!address.latitude || !address.longitude) {
    return "https://www.openstreetmap.org/export/embed.html?bbox=28.85%2C-2.83%2C30.9%2C-1.04&layer=mapnik";
  }
  const latitude = Number(address.latitude) || KIGALI_CENTER.latitude;
  const longitude = Number(address.longitude) || KIGALI_CENTER.longitude;
  const span = 0.018;
  const bounds = [longitude - span, latitude - span, longitude + span, latitude + span].join(",");
  const marker = `&marker=${latitude},${longitude}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik${marker}`;
}

export function DeliveryLocationPicker({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<DeliveryAddress | null>(() => readSavedDeliveryAddress());
  const [province, setProvince] = useState(saved?.province || "");
  const [district, setDistrict] = useState(saved?.district || "");
  const [sector, setSector] = useState(saved?.sector || "");
  const [cell, setCell] = useState(saved?.cell || "");
  const [address, setAddress] = useState(saved?.address || "");
  const [landmark, setLandmark] = useState(saved?.landmark || "");
  const [coordinates, setCoordinates] = useState({ latitude: saved?.latitude || "", longitude: saved?.longitude || "" });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSavedAddress = () => setSaved(readSavedDeliveryAddress());
    window.addEventListener("storage", syncSavedAddress);
    window.addEventListener("ifix-delivery-address-changed", syncSavedAddress);
    return () => {
      window.removeEventListener("storage", syncSavedAddress);
      window.removeEventListener("ifix-delivery-address-changed", syncSavedAddress);
    };
  }, []);

  const districts = DISTRICTS_BY_PROVINCE[province] || [];
  const sectors = KIGALI_SECTORS_BY_DISTRICT[district] || [];
  const previewAddress = useMemo<DeliveryAddress>(() => ({
    province, district, sector, cell, address, landmark,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  }), [province, district, sector, cell, address, landmark, coordinates]);

  const startEditing = useCallback(() => {
    const current = readSavedDeliveryAddress();
    setSaved(current);
    setProvince(current?.province || "");
    setDistrict(current?.district || "");
    setSector(current?.sector || "");
    setCell(current?.cell || "");
    setAddress(current?.address || "");
    setLandmark(current?.landmark || "");
    setCoordinates({ latitude: current?.latitude || "", longitude: current?.longitude || "" });
    setError("");
    setOpen(true);
  }, []);

  useEffect(() => {
    const openEditor = () => startEditing();
    window.addEventListener("ifix-open-delivery-location", openEditor);
    return () => window.removeEventListener("ifix-open-delivery-location", openEditor);
  }, [startEditing]);

  const useCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Your browser does not support location sharing. Enter your address instead.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: String(coords.latitude), longitude: String(coords.longitude) });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError("We could not access your location. Allow location access for this site, or enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
  };

  const saveAddress = () => {
    if (!province || !district) {
      setError("Select your province and district to continue.");
      return;
    }
    if (isKigaliDistrict(district) && !sector) {
      setError("Select your sector in Kigali City to continue.");
      return;
    }
    const nextAddress = { ...previewAddress };
    sessionStorage.setItem(DELIVERY_ADDRESS_STORAGE_KEY, JSON.stringify(nextAddress));
    setSaved(nextAddress);
    window.dispatchEvent(new Event("ifix-delivery-address-changed"));
    setOpen(false);
  };

  const clearAddress = () => {
    sessionStorage.removeItem(DELIVERY_ADDRESS_STORAGE_KEY);
    setSaved(null);
    setProvince(""); setDistrict(""); setSector(""); setCell(""); setAddress(""); setLandmark("");
    setCoordinates({ latitude: "", longitude: "" });
    window.dispatchEvent(new Event("ifix-delivery-address-changed"));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={startEditing}
          aria-label={saved ? `Delivery location: ${saved.district}, ${saved.province}. Change address` : "Set delivery location"}
          className={`inline-flex max-w-full shrink-0 items-center rounded-lg text-left text-foreground transition hover:bg-accent/70 hover:text-primary ${compact ? "h-9 gap-1 px-1.5" : "h-10 gap-2 px-2"}`}
        >
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0">
            {!compact && <span className="block text-[10px] leading-3 text-muted-foreground">Deliver to</span>}
            <span className={`block truncate text-xs font-semibold ${compact ? "max-w-[94px] leading-4" : "max-w-[118px] leading-4 sm:max-w-[150px]"}`}>
              {saved ? `${saved.district}${saved.sector ? `, ${saved.sector}` : ""}` : "Choose location"}
            </span>
          </span>
          {!compact && <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </button>
      </DialogTrigger>

      <DialogContent
        overlayClassName="bg-black/35 backdrop-blur-md"
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-14 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" /> Add delivery address
          </DialogTitle>
          <DialogDescription>Your order will be delivered to this location. Our team may contact you to confirm the address.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Province
              <select value={province} onChange={(event) => { setProvince(event.target.value); setDistrict(""); setSector(""); }} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">Choose province</option>
                {PROVINCES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              District
              <select value={district} disabled={!province} onChange={(event) => { setDistrict(event.target.value); setSector(""); }} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
                <option value="">Choose district</option>
                {districts.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            {sectors.length > 0 && (
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                Sector
                <select value={sector} onChange={(event) => setSector(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option value="">Choose sector</option>
                  {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Cell <span className="font-normal">(optional)</span>
              <input value={cell} onChange={(event) => setCell(event.target.value)} maxLength={100} placeholder="Enter your cell" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
            National address, street, or building <span className="font-normal">(optional)</span>
            <input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={180} placeholder="Enter your national address or building name" autoComplete="street-address" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
            Landmark or delivery directions <span className="font-normal">(optional)</span>
            <input value={landmark} onChange={(event) => setLandmark(event.target.value)} maxLength={180} placeholder="Nearby landmark, building, floor, or directions" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>

          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <iframe
              key={coordinates.latitude ? `${coordinates.latitude}-${coordinates.longitude}` : "rwanda-overview"}
              title="Delivery location map"
              src={mapUrl(previewAddress)}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-40 w-full border-0 sm:h-52"
            />
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-3 py-2 text-[10px] text-muted-foreground">
              <span>{coordinates.latitude ? "Current location captured" : "Rwanda overview · share your location to pin the map"}</span>
              <a href={coordinates.latitude ? `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=16/${coordinates.latitude}/${coordinates.longitude}` : "https://www.openstreetmap.org/#map=8/-1.94/29.87"} target="_blank" rel="noopener noreferrer" className="shrink-0 font-medium underline underline-offset-2">© OpenStreetMap</a>
            </div>
          </div>

          <button type="button" onClick={useCurrentLocation} disabled={gpsLoading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60">
            <Navigation className="h-4 w-4" /> {gpsLoading ? "Finding your location…" : coordinates.latitude ? "Update with current location" : "Use current location"}
          </button>
          <p className="text-xs text-muted-foreground">Your precise location stays in this browser session until you submit an order. The map provider receives the map coordinates to display the preview.</p>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 sm:px-6">
          {saved ? <button type="button" onClick={clearAddress} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition hover:text-destructive"><X className="h-3.5 w-3.5" />Clear address</button> : <span className="text-xs text-muted-foreground">Delivery is free in supported Rwanda districts.</span>}
          <button type="button" onClick={saveAddress} className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-105">Save delivery location</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
