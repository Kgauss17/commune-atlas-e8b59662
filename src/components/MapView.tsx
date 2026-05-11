import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, Marker, Tooltip as LTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Voter } from '@/types/voter';

interface MapViewProps {
  voters: Voter[];
}

type IndicatorKey = 'electeurs' | 'bureaux' | 'circonscriptions';

const INDICATORS: Record<IndicatorKey, { label: string; short: string }> = {
  electeurs: { label: "Nombre d'électeurs", short: 'Électeurs' },
  bureaux: { label: 'Bureaux de vote', short: 'Bureaux' },
  circonscriptions: { label: 'Circonscriptions', short: 'Circonscriptions' },
};

const PALETTE = ['#F4A89A', '#F8C9A8', '#A8D5E2', '#7FCFB5', '#5BA8C9'];
const CLASS_LABELS = ['Très faible', 'Faible', 'Moyen', 'Élevé', 'Très élevé'];

const fmt = (v: number) => (v ?? 0).toLocaleString('fr-FR');

function quantileBreaks(values: number[]): number[] {
  const sorted = values.filter((v) => v != null).slice().sort((a, b) => a - b);
  if (!sorted.length) return [0, 0, 0, 0, 0, 0];
  const q = (p: number) => {
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  return [sorted[0], q(0.2), q(0.4), q(0.6), q(0.8), sorted[sorted.length - 1]];
}

// Normalize name for matching between voter data and geojson
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(mun\.\)|\(municipalité\)/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const MapView = ({ voters }: MapViewProps) => {
  const [geo, setGeo] = useState<any | null>(null);
  const [chefLieu, setChefLieu] = useState<any | null>(null);
  const [elections, setElections] = useState<Record<string, any>>({});
  const [indicator, setIndicator] = useState<IndicatorKey>('electeurs');
  const [selected, setSelected] = useState<string | null>(null);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/communes.geojson').then((r) => r.json()),
      fetch('/data/elections.json').then((r) => r.json()).catch(() => ({})),
      fetch('/data/chef_lieu.geojson').then((r) => r.json()).catch(() => null),
    ]).then(([g, e, c]) => {
      setGeo(g);
      setElections(e || {});
      setChefLieu(c);
    });
  }, []);

  // Aggregate voters by commune (normalized)
  const aggByCommune = useMemo(() => {
    const map = new Map<string, { electeurs: number; bureaux: Set<string>; circonscriptions: Set<string>; nom_ar?: string }>();
    voters.forEach((v) => {
      const key = normalize(v.commune);
      if (!key) return;
      if (!map.has(key)) map.set(key, { electeurs: 0, bureaux: new Set(), circonscriptions: new Set() });
      const o = map.get(key)!;
      o.electeurs += 1;
      if (v.bvName) o.bureaux.add(v.bvName);
      if (v.circonscription) o.circonscriptions.add(v.circonscription);
    });
    return map;
  }, [voters]);

  // Enrich features with indicator values
  const enrichedGeo = useMemo(() => {
    if (!geo) return null;
    const clone = {
      ...geo,
      features: geo.features.map((f: any) => {
        const name = f.properties.nom_commun;
        const key = normalize(name);
        const local = aggByCommune.get(key);
        const fallback = elections[name] || {};
        return {
          ...f,
          properties: {
            ...f.properties,
            nom_ar: fallback.nom_ar || '',
            electeurs: local ? local.electeurs : fallback.electeurs ?? 0,
            bureaux: local ? local.bureaux.size : fallback.bureaux ?? 0,
            circonscriptions: local ? local.circonscriptions.size : fallback.circonscriptions ?? 0,
          },
        };
      }),
    };
    return clone;
  }, [geo, aggByCommune, elections]);

  const breaks = useMemo(() => {
    if (!enrichedGeo) return [0, 0, 0, 0, 0, 0];
    return quantileBreaks(enrichedGeo.features.map((f: any) => f.properties[indicator]));
  }, [enrichedGeo, indicator]);

  const classify = (v: number) => {
    if (v == null) return -1;
    for (let i = 0; i < 5; i++) if (v <= breaks[i + 1]) return i;
    return 4;
  };
  const colorFor = (v: number) => {
    const c = classify(v);
    return c < 0 ? '#cbd5e1' : PALETTE[c];
  };

  const styleFeature = (f: any) => {
    const v = f.properties[indicator];
    const c = classify(v);
    const dim = activeClass != null && c !== activeClass;
    return {
      color: '#1e293b',
      weight: selected === f.properties.nom_commun ? 3 : 1,
      fillColor: colorFor(v),
      fillOpacity: dim ? 0.15 : 0.78,
      opacity: dim ? 0.4 : 1,
    };
  };

  // Re-style on changes
  useEffect(() => {
    if (geoLayerRef.current) {
      geoLayerRef.current.setStyle(styleFeature as any);
      geoLayerRef.current.eachLayer((l: any) => {
        const p = l.feature.properties;
        l.setTooltipContent(
          `<b>${p.nom_commun}</b><br>${p.nom_ar || ''}<br>${INDICATORS[indicator].short}: ${fmt(p[indicator])}`,
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicator, activeClass, selected, enrichedGeo]);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const p = feature.properties;
    layer.bindTooltip(
      `<b>${p.nom_commun}</b><br>${p.nom_ar || ''}<br>${INDICATORS[indicator].short}: ${fmt(p[indicator])}`,
      { sticky: true },
    );
    layer.on('click', () => {
      setSelected(p.nom_commun);
      (layer as any)
        .bindPopup(
          `<div style="font-weight:600;margin-bottom:4px">${p.nom_commun} <span style="color:#64748b;font-weight:400;font-size:12px">${p.nom_ar || ''}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px"><span>Électeurs</span><b>${fmt(p.electeurs)}</b></div>
          <div style="display:flex;justify-content:space-between;gap:12px"><span>Bureaux</span><b>${fmt(p.bureaux)}</b></div>
          <div style="display:flex;justify-content:space-between;gap:12px"><span>Circonscriptions</span><b>${fmt(p.circonscriptions)}</b></div>`,
        )
        .openPopup();
    });
  };

  // KPIs
  const totals = useMemo(() => {
    if (!enrichedGeo) return { electeurs: 0, bureaux: 0, circonscriptions: 0, communes: 0 };
    const sum = (k: IndicatorKey) => enrichedGeo.features.reduce((s: number, f: any) => s + (f.properties[k] || 0), 0);
    return {
      electeurs: sum('electeurs'),
      bureaux: sum('bureaux'),
      circonscriptions: sum('circonscriptions'),
      communes: enrichedGeo.features.length,
    };
  }, [enrichedGeo]);

  const ranking = useMemo(() => {
    if (!enrichedGeo) return [];
    return [...enrichedGeo.features]
      .map((f: any) => ({
        name: f.properties.nom_commun,
        nom_ar: f.properties.nom_ar,
        value: f.properties[indicator] || 0,
        cls: classify(f.properties[indicator] || 0),
      }))
      .sort((a, b) => b.value - a.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedGeo, indicator, breaks]);

  const chefLieuIcon = useMemo(
    () =>
      L.divIcon({
        className: 'cl-icon',
        html: '<div style="font-size:18px;line-height:1;color:#dc2626">★</div>',
        iconSize: [20, 20],
      }),
    [],
  );

  const bounds = useMemoBounds(enrichedGeo);

  if (!enrichedGeo || !bounds) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Chargement de la carte…</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Communes" value={totals.communes} />
        <KpiCard label="Électeurs" value={totals.electeurs} />
        <KpiCard label="Bureaux de vote" value={totals.bureaux} />
        <KpiCard label="Circonscriptions" value={totals.circonscriptions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">Carte des communes — Province de Figuig</CardTitle>
            <Select value={indicator} onValueChange={(v) => { setIndicator(v as IndicatorKey); setActiveClass(null); }}>
              <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INDICATORS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[520px] rounded-md overflow-hidden border">
              <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Relief HD">
                    <TileLayer
                      attribution="Tiles &copy; Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                      attribution="Tiles &copy; Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Clair (Carto)">
                    <TileLayer
                      attribution="&copy; OSM &copy; CARTO"
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                <GeoJSON
                  key={indicator + ':' + voters.length}
                  data={enrichedGeo as any}
                  style={styleFeature as any}
                  onEachFeature={onEachFeature}
                  ref={(r) => { geoLayerRef.current = r as any; }}
                />
                {chefLieu?.features?.map((f: any, i: number) => {
                  const [lng, lat] = f.geometry.coordinates;
                  return (
                    <Marker key={i} position={[lat, lng]} icon={chefLieuIcon}>
                      <LTooltip>{f.properties?.nom_commun || f.properties?.name || 'Chef-lieu'}</LTooltip>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {INDICATORS[indicator].label}
              </p>
              <div className="flex flex-wrap gap-2">
                {[4, 3, 2, 1, 0].map((i) => {
                  const lo = breaks[i], hi = breaks[i + 1];
                  const active = activeClass === i;
                  const dim = activeClass != null && !active;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveClass(active ? null : i)}
                      className={`flex items-center gap-2 text-xs px-2 py-1 rounded border transition-opacity ${dim ? 'opacity-40' : ''} ${active ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                    >
                      <span className="w-3 h-3 rounded-sm" style={{ background: PALETTE[i] }} />
                      <span>{CLASS_LABELS[i]}</span>
                      <span className="text-muted-foreground">({fmt(Math.round(lo))}–{fmt(Math.round(hi))})</span>
                    </button>
                  );
                })}
                {activeClass != null && (
                  <button onClick={() => setActiveClass(null)} className="text-xs underline text-muted-foreground">
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Classement — {INDICATORS[indicator].short}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {ranking.map((r) => {
                const isSel = selected === r.name;
                const dim = activeClass != null && r.cls !== activeClass;
                const max = ranking[0]?.value || 1;
                return (
                  <button
                    key={r.name}
                    onClick={() => setSelected(r.name)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${isSel ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'} ${dim ? 'opacity-40' : ''}`}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{r.name}</span>
                      <span className="font-mono font-semibold text-primary shrink-0 ml-2">{fmt(r.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(r.value / max) * 100}%`, background: PALETTE[r.cls] || '#cbd5e1' }}
                      />
                    </div>
                    {r.nom_ar && <div className="text-[10px] text-muted-foreground mt-0.5">{r.nom_ar}</div>}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{ranking.length} communes</Badge>
              <span>Source: GeoJSON Figuig</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value }: { label: string; value: number }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value.toLocaleString('fr-FR')}</p>
    </CardContent>
  </Card>
);

// Compute bounds from geojson once
function useMemoBounds(geo: any): L.LatLngBoundsExpression | null {
  return useMemo(() => {
    if (!geo) return null;
    const layer = L.geoJSON(geo);
    const b = layer.getBounds();
    return [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
  }, [geo]);
}

export default MapView;
