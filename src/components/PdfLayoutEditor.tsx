import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Type, AlignLeft, Ruler } from 'lucide-react';

export interface PdfLayoutConfig {
  orientation: 'landscape' | 'portrait';
  margins: { top: number; bottom: number; left: number; right: number };
  fontSize: number;
  headerFontSize: number;
  showHeader: boolean;
  showFooter: boolean;
  showAccentBar: boolean;
  showAlternateRows: boolean;
  headerBgColor: string;
  accentColor: string;
  footerText: string;
  headerSubtitle: string;
  showDate: boolean;
  showTotal: boolean;
  showPageNumbers: boolean;
  showLogo: boolean;
  tableCellPadding: number;
}

export const defaultLayoutConfig: PdfLayoutConfig = {
  orientation: 'landscape',
  margins: { top: 42, bottom: 18, left: 10, right: 10 },
  fontSize: 12,
  headerFontSize: 16,
  showHeader: true,
  showFooter: true,
  showAccentBar: true,
  showAlternateRows: true,
  headerBgColor: '#2979CC',
  accentColor: '#343A40',
  footerText: 'حالة انتخابية',
  headerSubtitle: '',
  showDate: true,
  showTotal: true,
  showPageNumbers: true,
  showLogo: true,
  tableCellPadding: 2,
};

interface PdfLayoutEditorProps {
  config: PdfLayoutConfig;
  onChange: (config: PdfLayoutConfig) => void;
  titleAr: string;
}

// Visual dimensions for the preview (proportional to A4)
const PREVIEW_SCALE = 0.65;
const PAGE_W_L = 297 * PREVIEW_SCALE; // landscape
const PAGE_H_L = 210 * PREVIEW_SCALE;
const PAGE_W_P = 210 * PREVIEW_SCALE;
const PAGE_H_P = 297 * PREVIEW_SCALE;

const PdfLayoutEditor = ({ config, onChange, titleAr }: PdfLayoutEditorProps) => {
  const update = <K extends keyof PdfLayoutConfig>(key: K, value: PdfLayoutConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateMargin = (side: keyof PdfLayoutConfig['margins'], value: number) => {
    onChange({ ...config, margins: { ...config.margins, [side]: value } });
  };

  const isLandscape = config.orientation === 'landscape';
  const pageW = isLandscape ? PAGE_W_L : PAGE_W_P;
  const pageH = isLandscape ? PAGE_H_L : PAGE_H_P;

  // Scale margins for preview (mm -> px proportionally)
  const mScale = PREVIEW_SCALE;
  const mTop = config.margins.top * mScale;
  const mBottom = config.margins.bottom * mScale;
  const mLeft = config.margins.left * mScale;
  const mRight = config.margins.right * mScale;

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <Card className="border-l-4 border-l-accent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Éditeur de mise en page PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Visual Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aperçu de la page</Label>
            <div
              className="relative bg-white border-2 border-border shadow-lg rounded-sm"
              style={{ width: pageW, height: pageH }}
            >
              {/* Accent bar top */}
              {config.showAccentBar && (
                <div
                  className="absolute top-0 left-0 right-0 rounded-t-sm"
                  style={{ height: 3 * mScale, backgroundColor: config.headerBgColor }}
                />
              )}

              {/* Header zone */}
              {config.showHeader && (
                <div
                  className="absolute left-0 right-0 flex flex-col items-center justify-center"
                  style={{
                    top: config.showAccentBar ? 3 * mScale : 0,
                    height: mTop - (config.showAccentBar ? 3 * mScale : 0),
                    backgroundColor: '#f5f7fa',
                  }}
                >
                  {config.showLogo && (
                    <div
                      className="rounded-full flex items-center justify-center text-white font-bold"
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: config.headerBgColor,
                        fontSize: 5,
                        marginBottom: 2,
                      }}
                    >
                      GE
                    </div>
                  )}
                  <div
                    className="text-center font-bold truncate px-1"
                    style={{ fontSize: Math.max(6, config.headerFontSize * mScale * 0.45), color: '#1e1e1e', direction: 'rtl' }}
                  >
                    {titleAr || 'عنوان التقرير'}
                  </div>
                  {config.headerSubtitle && (
                    <div className="text-center truncate px-1" style={{ fontSize: 4, color: '#888', direction: 'rtl' }}>
                      {config.headerSubtitle}
                    </div>
                  )}
                  {(config.showDate || config.showTotal) && (
                    <div className="flex gap-1 text-center" style={{ fontSize: 3.5, color: '#999' }}>
                      {config.showDate && <span>التاريخ</span>}
                      {config.showDate && config.showTotal && <span>|</span>}
                      {config.showTotal && <span>المجموع</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Margin guides (dashed) */}
              <div
                className="absolute border border-dashed border-blue-300/60 pointer-events-none"
                style={{
                  top: mTop,
                  left: mLeft,
                  right: mRight,
                  bottom: mBottom,
                }}
              />

              {/* Table content zone */}
              <div
                className="absolute overflow-hidden"
                style={{
                  top: mTop + 2,
                  left: mLeft,
                  right: mRight,
                  bottom: mBottom + 2,
                }}
              >
                {/* Fake table header */}
                <div
                  className="flex w-full"
                  style={{ backgroundColor: config.accentColor, height: 8 }}
                >
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-1 mx-px rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.15)', height: 4, marginTop: 2 }} />
                  ))}
                </div>
                {/* Fake table rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-full"
                    style={{
                      height: Math.max(5, config.tableCellPadding * mScale + 4),
                      backgroundColor: config.showAlternateRows && i % 2 === 1 ? '#f5f7fa' : 'transparent',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map(j => (
                      <div
                        key={j}
                        className="flex-1 mx-px rounded-sm"
                        style={{
                          backgroundColor: '#d1d5db',
                          height: 3,
                          marginTop: Math.max(1, config.tableCellPadding * mScale * 0.3),
                          opacity: 0.5,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer zone */}
              {config.showFooter && (
                <div
                  className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-2"
                  style={{
                    height: mBottom,
                    backgroundColor: '#fafafa',
                  }}
                >
                  <span style={{ fontSize: 3.5, color: '#999', direction: 'rtl' }}>
                    {config.footerText || 'نص التذييل'}
                  </span>
                  {config.showPageNumbers && (
                    <span style={{ fontSize: 3.5, color: '#999' }}>Page 1 / N</span>
                  )}
                </div>
              )}

              {/* Accent bar bottom */}
              {config.showAccentBar && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-sm"
                  style={{ height: 2 * mScale, backgroundColor: config.headerBgColor }}
                />
              )}

              {/* Margin labels */}
              <div className="absolute text-[7px] text-blue-400 font-mono" style={{ top: mTop / 2 - 4, left: '50%', transform: 'translateX(-50%)' }}>
                ↕ {config.margins.top}mm
              </div>
              <div className="absolute text-[7px] text-blue-400 font-mono" style={{ bottom: mBottom / 2 - 4, left: '50%', transform: 'translateX(-50%)' }}>
                ↕ {config.margins.bottom}mm
              </div>
              <div className="absolute text-[7px] text-blue-400 font-mono" style={{ left: 1, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }}>
                {config.margins.left}mm
              </div>
              <div className="absolute text-[7px] text-blue-400 font-mono" style={{ right: 1, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }}>
                {config.margins.right}mm
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isLandscape ? '297 × 210 mm (Paysage)' : '210 × 297 mm (Portrait)'}
            </p>
          </div>

          {/* RIGHT: Settings Tabs */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="page" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-9">
                <TabsTrigger value="page" className="text-xs gap-1"><Ruler className="h-3 w-3" /> Page</TabsTrigger>
                <TabsTrigger value="header" className="text-xs gap-1"><Type className="h-3 w-3" /> En-tête</TabsTrigger>
                <TabsTrigger value="table" className="text-xs gap-1"><AlignLeft className="h-3 w-3" /> Tableau</TabsTrigger>
                <TabsTrigger value="footer" className="text-xs gap-1"><Settings2 className="h-3 w-3" /> Pied</TabsTrigger>
              </TabsList>

              {/* Page Tab */}
              <TabsContent value="page" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Orientation</Label>
                  <Select value={config.orientation} onValueChange={v => update('orientation', v as any)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Paysage</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Marges (mm)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                      <div key={side} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground capitalize">
                            {side === 'top' ? 'Haut' : side === 'bottom' ? 'Bas' : side === 'left' ? 'Gauche' : 'Droite'}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">{config.margins[side]}mm</span>
                        </div>
                        <Slider
                          value={[config.margins[side]]}
                          onValueChange={([v]) => updateMargin(side, v)}
                          min={5}
                          max={side === 'top' ? 60 : side === 'bottom' ? 40 : 30}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Barres d'accentuation</Label>
                  <Switch checked={config.showAccentBar} onCheckedChange={v => update('showAccentBar', v)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Couleur d'accentuation</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.headerBgColor}
                      onChange={e => update('headerBgColor', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.headerBgColor}
                      onChange={e => update('headerBgColor', e.target.value)}
                      className="h-8 text-xs font-mono flex-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Header Tab */}
              <TabsContent value="header" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Afficher l'en-tête</Label>
                  <Switch checked={config.showHeader} onCheckedChange={v => update('showHeader', v)} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Afficher le logo</Label>
                  <Switch checked={config.showLogo} onCheckedChange={v => update('showLogo', v)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Taille titre (pt)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[config.headerFontSize]}
                      onValueChange={([v]) => update('headerFontSize', v)}
                      min={10}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-8 text-right">{config.headerFontSize}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Sous-titre</Label>
                  <Input
                    value={config.headerSubtitle}
                    onChange={e => update('headerSubtitle', e.target.value)}
                    placeholder="Sous-titre optionnel"
                    className="h-8 text-xs"
                    dir="rtl"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Afficher la date</Label>
                  <Switch checked={config.showDate} onCheckedChange={v => update('showDate', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Afficher le total</Label>
                  <Switch checked={config.showTotal} onCheckedChange={v => update('showTotal', v)} />
                </div>
              </TabsContent>

              {/* Table Tab */}
              <TabsContent value="table" className="space-y-4 mt-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Taille police tableau (pt)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[config.fontSize]}
                      onValueChange={([v]) => update('fontSize', v)}
                      min={6}
                      max={16}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-8 text-right">{config.fontSize}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Espacement cellules</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[config.tableCellPadding]}
                      onValueChange={([v]) => update('tableCellPadding', v)}
                      min={1}
                      max={5}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-8 text-right">{config.tableCellPadding}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Lignes alternées</Label>
                  <Switch checked={config.showAlternateRows} onCheckedChange={v => update('showAlternateRows', v)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Couleur en-tête tableau</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={e => update('accentColor', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={e => update('accentColor', e.target.value)}
                      className="h-8 text-xs font-mono flex-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Footer Tab */}
              <TabsContent value="footer" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Afficher le pied de page</Label>
                  <Switch checked={config.showFooter} onCheckedChange={v => update('showFooter', v)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Texte du pied de page</Label>
                  <Input
                    value={config.footerText}
                    onChange={e => update('footerText', e.target.value)}
                    className="h-8 text-xs"
                    dir="rtl"
                    placeholder="حالة انتخابية"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Numéros de page</Label>
                  <Switch checked={config.showPageNumbers} onCheckedChange={v => update('showPageNumbers', v)} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfLayoutEditor;
