"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type Coordinates = { lng: number; lat: number };

async function geocodeAddress(
  address: string,
  token: string,
): Promise<Coordinates | null> {
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: { center?: [number, number] }[];
  };
  const center = data?.features?.[0]?.center;
  if (!Array.isArray(center) || center.length < 2) return null;
  return { lng: center[0], lat: center[1] };
}

function staticPreviewUrl(
  lng: number,
  lat: number,
  token: string,
  width: number,
  height: number,
): string {
  const zoom = 14;
  const pin = `pin-s+2887c8(${lng},${lat})`;
  const path = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin}/${lng},${lat},${zoom}/${width}x${height}@2x`;
  return `${path}?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`;
}

type Props = {
  address: string;
};

/**
 * Address preview via Mapbox Geocoding + Static Images (no WebGL SDK).
 * Caller should only mount when `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set.
 */
export function JobLocationMap({ address }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const [phase, setPhase] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setPhase("error");
      return;
    }

    const trimmed = address.trim();
    if (!trimmed) {
      setPhase("empty");
      setCoords(null);
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setCoords(null);
    setImageFailed(false);

    const timer = window.setTimeout(() => {
      void geocodeAddress(trimmed, token)
        .then((geo) => {
          if (cancelled) return;
          if (!geo) {
            setCoords(null);
            setPhase("empty");
            return;
          }
          setCoords(geo);
          setPhase("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setPhase("error");
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [address, token]);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;

  const openButton = (
    <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
      <a href={mapsHref} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        Open in Maps
      </a>
    </Button>
  );

  if (phase === "loading") {
    return (
      <div className="ergon-card border border-border p-5">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="ergon-card border border-border p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          Map could not be loaded. Check your connection or try again later.
        </p>
        {openButton}
      </div>
    );
  }

  if (phase === "empty" || !coords) {
    const trimmed = address.trim();
    return (
      <div className="ergon-card border border-border p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          {!trimmed
            ? "Enter an address to see the map."
            : "This address could not be located on the map."}
        </p>
        {trimmed ? openButton : null}
      </div>
    );
  }

  const previewSrc = staticPreviewUrl(coords.lng, coords.lat, token, 640, 360);

  if (imageFailed) {
    return (
      <div className="ergon-card border border-border p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          Map preview could not be displayed.
        </p>
        {openButton}
      </div>
    );
  }

  return (
    <div className="ergon-card overflow-hidden border border-border p-0">
      <div className="relative h-[220px] min-h-[200px] w-full sm:h-[260px] md:h-[280px]">
        <img
          src={previewSrc}
          alt={`Map preview near ${address.trim()}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {address.trim()}
        </p>
        {openButton}
      </div>
    </div>
  );
}
