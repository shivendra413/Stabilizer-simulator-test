import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card,CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Slider } from "./components/ui/slider";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "./components/ui/tabs";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "./components/ui/select";
// ...existing code...
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

/**
 * STABILISER PRICE SIMULATION – UI WIREFRAME
 * -------------------------------------------------
 * One-file React UI scaffold for your Stabiliser BOM price simulation agent.
 * - Modern shadcn/ui + Tailwind styling
 * - Recharts for quick visuals
 * - Framer Motion for subtle transitions
 * 
 * How to use:
 * 1) Drop this file in a React/Vite app (e.g., src/StabiliserSimulator.tsx)
 * 2) Ensure Tailwind + shadcn/ui + recharts are installed
 * 3) Render <StabiliserSimulator /> anywhere in your app
 * 4) Later: replace SAMPLE_DATA with live data or API hooks
 */

// ---------------------- SAMPLE DATA (replace with real) ----------------------
const MATERIALS = {
  M_COPPER: { name: "Copper Wire", uom: "KG", latestPrice: 820 },
  M_ALUM: { name: "Aluminium Wire", uom: "KG", latestPrice: 255 },
  M_STEEL_LAM: { name: "CRGO Steel Laminations", uom: "KG", latestPrice: 152 },
  M_ABS: { name: "ABS Plastic", uom: "KG", latestPrice: 178 },
  M_PCBA: { name: "PCB Assembly", uom: "EA", latestPrice: 350 },
  M_DISPLAY: { name: "7-seg Display", uom: "EA", latestPrice: 120 },
  M_SOLDER: { name: "Solder 60/40", uom: "KG", latestPrice: 1200 },
  M_SWITCH: { name: "Switch Kit", uom: "EA", latestPrice: 50 },
  M_PACK: { name: "Packaging Set", uom: "SET", latestPrice: 70 },
  M_RELAY: { name: "Power Relay", uom: "EA", latestPrice: 110 },
  M_MC: { name: "Microcontroller", uom: "EA", latestPrice: 90 },
};

const PRODUCTS = {
  P100: { name: "SB-1kVA-Digital", listPrice: 6500, targetMargin: 0.25, plant: "HYD1" },
  P200: { name: "SB-2kVA-Digital", listPrice: 9000, targetMargin: 0.25, plant: "HYD1" },
  P300: { name: "SB-0.5kVA-Refrigerator", listPrice: 3500, targetMargin: 0.25, plant: "HYD1" },
};

const OVERHEADS: { [key: string]: { laborPctOfDM: number; energyPctOfDM: number; freightPerUnit: number; warrantyPctOfSP: number } } = {
  HYD1: { laborPctOfDM: 0.08, energyPctOfDM: 0.04, freightPerUnit: 60, warrantyPctOfSP: 0.01 }
};

const BOM: Record<string, { materialId: keyof typeof MATERIALS; qty: number; uom: string }[]> = {
  P100: [
    { materialId: "M_COPPER", qty: 2.5, uom: "KG" },
    { materialId: "M_STEEL_LAM", qty: 3.0, uom: "KG" },
    { materialId: "M_PCBA", qty: 1.0, uom: "EA" },
    { materialId: "M_DISPLAY", qty: 1.0, uom: "EA" },
    { materialId: "M_ABS", qty: 1.2, uom: "KG" },
    { materialId: "M_SOLDER", qty: 0.05, uom: "KG" },
    { materialId: "M_SWITCH", qty: 1.0, uom: "EA" },
    { materialId: "M_PACK", qty: 1.0, uom: "SET" },
    { materialId: "M_RELAY", qty: 2.0, uom: "EA" },
    { materialId: "M_MC", qty: 1.0, uom: "EA" },
  ],
  P200: [
    { materialId: "M_COPPER", qty: 4.0, uom: "KG" },
    { materialId: "M_STEEL_LAM", qty: 4.5, uom: "KG" },
    { materialId: "M_PCBA", qty: 1.0, uom: "EA" },
    { materialId: "M_DISPLAY", qty: 1.0, uom: "EA" },
    { materialId: "M_ABS", qty: 1.5, uom: "KG" },
    { materialId: "M_SOLDER", qty: 0.06, uom: "KG" },
    { materialId: "M_SWITCH", qty: 1.0, uom: "EA" },
    { materialId: "M_PACK", qty: 1.0, uom: "SET" },
    { materialId: "M_RELAY", qty: 3.0, uom: "EA" },
    { materialId: "M_MC", qty: 1.0, uom: "EA" },
  ],
  P300: [
    { materialId: "M_COPPER", qty: 1.2, uom: "KG" },
    { materialId: "M_STEEL_LAM", qty: 1.5, uom: "KG" },
    { materialId: "M_PCBA", qty: 1.0, uom: "EA" },
    { materialId: "M_ABS", qty: 0.8, uom: "KG" },
    { materialId: "M_SOLDER", qty: 0.03, uom: "KG" },
    { materialId: "M_SWITCH", qty: 1.0, uom: "EA" },
    { materialId: "M_PACK", qty: 1.0, uom: "SET" },
    { materialId: "M_RELAY", qty: 1.0, uom: "EA" },
    { materialId: "M_MC", qty: 1.0, uom: "EA" },
  ],
};

// Substitution rule: 1 kg Cu -> 1.6 kg Al, cap 40%
const SUB_RULE = { base: "M_COPPER" as const, sub: "M_ALUM" as const, ratio: 1.6, capPct: 0.4 };

// ---------------------- Helpers ----------------------
function rupees(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function computeCosts({
  sku,
  priceShocks, // { materialId: pctDecimal }
  substitutionPct, // 0..0.4 for copper
  overheadOverrides, // { laborPctOfDM?, energyPctOfDM?, freightPerUnit?, warrantyPctOfSP? }
  targetMarginOverride, // decimal
  listPriceOverride, // number
}: {
  sku: keyof typeof PRODUCTS;
  priceShocks: Record<string, number>;
  substitutionPct: number;
  overheadOverrides?: Partial<(typeof OVERHEADS)["HYD1"]>;
  targetMarginOverride?: number;
  listPriceOverride?: number;
}) {
  const product = PRODUCTS[sku];
  const plantOh = OVERHEADS[product.plant];

  const targetMargin = targetMarginOverride ?? product.targetMargin;
  const listPrice = listPriceOverride ?? product.listPrice;

  // Effective prices after shocks
  const effPrice: Record<string, number> = {};
  Object.entries(MATERIALS).forEach(([mid, m]) => {
    const pct = priceShocks[mid] ?? 0;
    effPrice[mid] = m.latestPrice * (1 + pct);
  });

  // Apply substitution on BOM clone
  let bomLines = [...(BOM[sku] || [])];
  if (substitutionPct > 0 && SUB_RULE && SUB_RULE.base === "M_COPPER") {
    const pct = Math.min(SUB_RULE.capPct, substitutionPct);
    // Adjust copper qty and add aluminium line
    bomLines = bomLines.map((l) => {
      if (l.materialId === SUB_RULE.base) {
        const baseAfter = l.qty * (1 - pct);
        return { ...l, qty: baseAfter };
      }
      return l;
    });
    const copperLine = (BOM[sku] || []).find((l) => l.materialId === SUB_RULE.base);
    if (copperLine) {
      const qtySub = copperLine.qty * pct * SUB_RULE.ratio;
      // Merge with existing aluminium line if present
      const existingIdx = bomLines.findIndex((l) => l.materialId === SUB_RULE.sub);
      if (existingIdx >= 0) bomLines[existingIdx] = { ...bomLines[existingIdx], qty: bomLines[existingIdx].qty + qtySub };
      else bomLines.push({ materialId: SUB_RULE.sub, qty: qtySub, uom: "KG" });
    }
  }

  // Direct material cost
  const directMaterialCost = bomLines.reduce((sum, l) => sum + l.qty * (effPrice[l.materialId] ?? MATERIALS[l.materialId].latestPrice), 0);

  const oh = { ...plantOh, ...(overheadOverrides || {}) };
  const labor = directMaterialCost * (oh.laborPctOfDM ?? 0);
  const energy = directMaterialCost * (oh.energyPctOfDM ?? 0);
  const freight = oh.freightPerUnit ?? 0;
  const warranty = listPrice * (oh.warrantyPctOfSP ?? 0);

  const totalCost = directMaterialCost + labor + energy + freight + warranty;
  const marginInr = listPrice - totalCost;
  const marginPct = marginInr / listPrice;
  const recommendedSP = totalCost / (1 - targetMargin);

  return { bomLines, directMaterialCost, labor, energy, freight, warranty, totalCost, listPrice, marginInr, marginPct, targetMargin, recommendedSP };
}

// ---------------------- UI ----------------------
export default function StabiliserSimulator() {
  const [sku, setSku] = useState<keyof typeof PRODUCTS>("P100");
  const [priceShocks, setPriceShocks] = useState<Record<string, number>>({});
  const [subPct, setSubPct] = useState(0); // 0..0.4
  const [laborPct, setLaborPct] = useState(OVERHEADS.HYD1.laborPctOfDM);
  const [energyPct, setEnergyPct] = useState(OVERHEADS.HYD1.energyPctOfDM);
  const [freight, setFreight] = useState(OVERHEADS.HYD1.freightPerUnit);
  const [warrantyPct, setWarrantyPct] = useState(OVERHEADS.HYD1.warrantyPctOfSP);
  const [targetMargin, setTargetMargin] = useState(PRODUCTS[sku].targetMargin);
  const [listPrice, setListPrice] = useState(PRODUCTS[sku].listPrice);
  const [scenarios, setScenarios] = useState<{ name: string; result: ReturnType<typeof computeCosts> }[]>([]);

  const result = useMemo(() =>
    computeCosts({
      sku,
      priceShocks,
      substitutionPct: subPct,
      overheadOverrides: { laborPctOfDM: laborPct, energyPctOfDM: energyPct, freightPerUnit: freight, warrantyPctOfSP: warrantyPct },
      targetMarginOverride: targetMargin,
      listPriceOverride: listPrice,
    }), [sku, priceShocks, subPct, laborPct, energyPct, freight, warrantyPct, targetMargin, listPrice]);

  const copperTrend = [
    { month: "May", price: 780 },
    { month: "Jun", price: 800 },
    { month: "Jul", price: 830 },
    { month: "Aug", price: 790 },
    { month: "Sep", price: 820 },
  ];

  const addScenario = () => {
    setScenarios((prev) => [...prev, { name: `Scenario ${prev.length + 1}`, result }]);
  };
  const resetScenarios = () => setScenarios([]);

  const shockSlider = (mid: keyof typeof MATERIALS) => (
    <div key={mid} className="flex items-center gap-3 py-2">
      <div className="w-48 text-sm font-medium">{MATERIALS[mid].name}</div>
      <Slider
        value={[Math.round((priceShocks[mid] || 0) * 100)]}
        min={-30}
        max={30}
        step={1}
        onValueChange={(v) => setPriceShocks((s) => ({ ...s, [mid]: (v[0] || 0) / 100 }))}
        className="w-64"
      />
      <div className="w-12 text-right text-sm">{Math.round((priceShocks[mid] || 0) * 100)}%</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full p-6 bg-gradient-to-b from-white to-slate-50">
      <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold mb-4">
        Stabiliser Price Simulation
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Inputs */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Select value={sku} onValueChange={(v) => { setSku(v as any); setTargetMargin(PRODUCTS[v as keyof typeof PRODUCTS].targetMargin); setListPrice(PRODUCTS[v as keyof typeof PRODUCTS].listPrice); }}>
                <SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCTS).map(([id,p]) => (
                    <SelectItem key={id} value={id}>{id} – {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>List Price (₹)</Label>
              <Input type="number" value={listPrice} onChange={(e) => setListPrice(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Target Margin (%)</Label>
              <Input type="number" value={Math.round(targetMargin*100)} onChange={(e) => setTargetMargin(Number(e.target.value)/100)} />
            </div>

            <div className="pt-2">
              <Label className="text-sm">Price Shocks (±%)</Label>
              <div className="mt-1 space-y-1">
                {Object.keys(MATERIALS).map((mid) => shockSlider(mid as keyof typeof MATERIALS))}
              </div>
            </div>

            <div className="pt-2">
              <Label>Substitution – Copper → Aluminium</Label>
              <div className="text-xs text-slate-500 mb-1">1 kg Cu → 1.6 kg Al (cap {Math.round(SUB_RULE.capPct*100)}%)</div>
              <Slider value={[Math.round(subPct*100)]} min={0} max={Math.round(SUB_RULE.capPct*100)} step={1} onValueChange={(v) => setSubPct((v[0]||0)/100)} />
              <div className="text-right text-sm mt-1">{Math.round(subPct*100)}%</div>
            </div>

            <div className="pt-2 space-y-2">
              <Label>Overheads</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs">Labor % of DM</div>
                  <Input type="number" value={Math.round(laborPct*100)} onChange={(e)=>setLaborPct(Number(e.target.value)/100)} />
                </div>
                <div>
                  <div className="text-xs">Energy % of DM</div>
                  <Input type="number" value={Math.round(energyPct*100)} onChange={(e)=>setEnergyPct(Number(e.target.value)/100)} />
                </div>
                <div>
                  <div className="text-xs">Freight / Unit (₹)</div>
                  <Input type="number" value={freight} onChange={(e)=>setFreight(Number(e.target.value||0))} />
                </div>
                <div>
                  <div className="text-xs">Warranty % of SP</div>
                  <Input type="number" value={Math.round(warrantyPct*100)} onChange={(e)=>setWarrantyPct(Number(e.target.value)/100)} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addScenario} className="rounded-2xl">Add Scenario</Button>
              <Button variant="secondary" onClick={resetScenarios} className="rounded-2xl">Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Outputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-4">
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
                  <TabsTrigger value="compare">Scenario Compare</TabsTrigger>
                  <TabsTrigger value="trend">Price Trend</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Direct Material" value={rupees(result.directMaterialCost)} />
                    <Stat label="Total Unit Cost" value={rupees(result.totalCost)} />
                    <Stat label="Margin %" value={(result.marginPct*100).toFixed(1)+"%"} />
                    <Stat label="Recommended SP" value={rupees(result.recommendedSP)} />
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-slate-600">
                        <tr>
                          <th className="py-2">Component</th>
                          <th className="py-2">Qty</th>
                          <th className="py-2">UoM</th>
                          <th className="py-2">Price</th>
                          <th className="py-2">Line Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.bomLines.map((l, i) => {
                          const price = (MATERIALS as any)[l.materialId].latestPrice * (1 + (priceShocks[l.materialId] || 0));
                          return (
                            <tr key={i} className="border-t">
                              <td className="py-2">{(MATERIALS as any)[l.materialId].name}</td>
                              <td className="py-2">{l.qty.toFixed(3)}</td>
                              <td className="py-2">{l.uom}</td>
                              <td className="py-2">{rupees(price)}</td>
                              <td className="py-2">{rupees(price * l.qty)}</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t font-medium">
                          <td className="py-2">Labor</td>
                          <td></td><td></td><td></td>
                          <td className="py-2">{rupees(result.labor)}</td>
                        </tr>
                        <tr className="border-t font-medium">
                          <td className="py-2">Energy</td>
                          <td></td><td></td><td></td>
                          <td className="py-2">{rupees(result.energy)}</td>
                        </tr>
                        <tr className="border-t font-medium">
                          <td className="py-2">Freight</td>
                          <td></td><td></td><td></td>
                          <td className="py-2">{rupees(result.freight)}</td>
                        </tr>
                        <tr className="border-t font-medium">
                          <td className="py-2">Warranty</td>
                          <td></td><td></td><td></td>
                          <td className="py-2">{rupees(result.warranty)}</td>
                        </tr>
                        <tr className="border-t font-semibold">
                          <td className="py-2">Total Unit Cost</td>
                          <td></td><td></td><td></td>
                          <td className="py-2">{rupees(result.totalCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="compare" className="pt-4">
                  {scenarios.length === 0 ? (
                    <div className="text-sm text-slate-500">No scenarios yet. Use <span className="font-medium">Add Scenario</span> to capture current settings.</div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenarios.map((s) => ({ name: s.name, marginPct: Number((s.result.marginPct*100).toFixed(2)), tuc: Math.round(s.result.totalCost) }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="marginPct" name="Margin %" />
                          <Bar dataKey="tuc" name="Total Unit Cost (₹)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="trend" className="pt-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={copperTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="price" name="Copper (₹/kg)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl bg-white shadow-sm border">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
