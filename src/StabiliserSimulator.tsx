import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * STABILISER COST SIMULATOR – Forecast + Inventory (Moving Average)
 * Beautiful vibrant glass design with white-blue theme
 */

// Enhanced material interface with inventory data
interface Material {
  id: string;
  name: string;
  uom: string;
  newPrice: number;
  oldCost: number;
  onHand: number;
  bomQty: number;
}

// Sample data with inventory information
const MATERIALS: Material[] = [
  { id: "M_COPPER", name: "Copper Wire (Electrolytic)", uom: "KG", newPrice: 880, oldCost: 800, onHand: 1000, bomQty: 2.5 },
  { id: "M_ALUM", name: "Aluminium Wire", uom: "KG", newPrice: 260, oldCost: 255, onHand: 800, bomQty: 0 },
  { id: "M_STEEL_LAM", name: "CRGO Steel Laminations", uom: "KG", newPrice: 155, oldCost: 150, onHand: 2000, bomQty: 3.0 },
  { id: "M_ABS", name: "ABS Plastic", uom: "KG", newPrice: 180, oldCost: 178, onHand: 500, bomQty: 1.2 },
  { id: "M_PCBA", name: "PCB Assembly", uom: "EA", newPrice: 360, oldCost: 350, onHand: 500, bomQty: 1.0 },
  { id: "M_DISPLAY", name: "7-seg Display", uom: "EA", newPrice: 125, oldCost: 120, onHand: 300, bomQty: 1.0 },
  { id: "M_SOLDER", name: "Solder 60/40", uom: "KG", newPrice: 1250, oldCost: 1200, onHand: 50, bomQty: 0.05 },
  { id: "M_SWITCH", name: "Switch Kit", uom: "EA", newPrice: 52, oldCost: 50, onHand: 1000, bomQty: 1.0 },
  { id: "M_PACK", name: "Packaging Set", uom: "SET", newPrice: 72, oldCost: 70, onHand: 800, bomQty: 1.0 },
  { id: "M_RELAY", name: "Power Relay", uom: "EA", newPrice: 115, oldCost: 110, onHand: 400, bomQty: 2.0 },
  { id: "M_MC", name: "Microcontroller", uom: "EA", newPrice: 95, oldCost: 90, onHand: 600, bomQty: 1.0 },
];

const PRODUCTS = {
  P100: { name: "SB-1kVA-Digital", listPrice: 6500, targetMargin: 0.25, plant: "HYD1" },
  P200: { name: "SB-2kVA-Digital", listPrice: 9000, targetMargin: 0.25, plant: "HYD1" },
  P300: { name: "SB-0.5kVA-Refrigerator", listPrice: 3500, targetMargin: 0.25, plant: "HYD1" },
};

// Helper functions
function rupees(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

interface ProcurementPlan {
  id: string;
  name: string;
  uom: string;
  grossReq: number;
  onHand: number;
  procureQty: number;
  oldCost: number;
  newPrice: number;
  spend: number;
  endQty: number;
  avgCost: number;
  bomQty: number;
}

function computeCostsWithInventory({
  sku,
  forecastUnits,
  materials,
  listPriceOverride,
  targetMarginOverride,
  laborPct,
  energyPct,
  freight,
  warrantyPct,
}: {
  sku: keyof typeof PRODUCTS;
  forecastUnits: number;
  materials: Material[];
  listPriceOverride?: number;
  targetMarginOverride?: number;
  laborPct: number;
  energyPct: number;
  freight: number;
  warrantyPct: number;
}) {
  const product = PRODUCTS[sku];
  const listPrice = listPriceOverride ?? product.listPrice;
  const targetMargin = targetMarginOverride ?? product.targetMargin;

  // Calculate procurement plan with moving average costs
  const procurementPlan: ProcurementPlan[] = materials.map(m => {
    const grossReq = m.bomQty * forecastUnits;
    const onHand = m.onHand;
    const procureQty = Math.max(0, grossReq - onHand);
    const spend = procureQty * m.newPrice;
    const endQty = onHand + procureQty;
    const avgCost = endQty > 0 ? ((onHand * m.oldCost + procureQty * m.newPrice) / endQty) : m.newPrice;

    return {
      id: m.id,
      name: m.name,
      uom: m.uom,
      grossReq,
      onHand,
      procureQty,
      oldCost: m.oldCost,
      newPrice: m.newPrice,
      spend,
      endQty,
      avgCost,
      bomQty: m.bomQty
    };
  });

  // Calculate direct material cost per unit using moving average costs
  const directMaterialCost = procurementPlan.reduce((sum, p) => sum + (p.bomQty * p.avgCost), 0);

  const labor = directMaterialCost * laborPct;
  const energy = directMaterialCost * energyPct;
  const warranty = listPrice * warrantyPct;

  const totalCost = directMaterialCost + labor + energy + freight + warranty;
  const marginInr = listPrice - totalCost;
  const marginPct = listPrice > 0 ? marginInr / listPrice : 0;
  const recommendedSP = (1 - targetMargin) > 0 ? (totalCost / (1 - targetMargin)) : totalCost;

  return {
    procurementPlan,
    directMaterialCost,
    labor,
    energy,
    freight,
    warranty,
    totalCost,
    listPrice,
    marginInr,
    marginPct,
    targetMargin,
    recommendedSP
  };
}

export default function StabiliserSimulator() {
  const [sku, setSku] = useState<keyof typeof PRODUCTS>("P100");
  const [forecastUnits, setForecastUnits] = useState(10000);
  const [materials, setMaterials] = useState<Material[]>(MATERIALS);
  const [laborPct, setLaborPct] = useState(0.08);
  const [energyPct, setEnergyPct] = useState(0.04);
  const [freight, setFreight] = useState(60);
  const [warrantyPct, setWarrantyPct] = useState(0.01);
  const [targetMargin, setTargetMargin] = useState(PRODUCTS[sku].targetMargin);
  const [listPrice, setListPrice] = useState(PRODUCTS[sku].listPrice);

  const result = useMemo(() => computeCostsWithInventory({
    sku,
    forecastUnits,
    materials,
    listPriceOverride: listPrice,
    targetMarginOverride: targetMargin,
    laborPct,
    energyPct,
    freight,
    warrantyPct,
  }), [sku, forecastUnits, materials, listPrice, targetMargin, laborPct, energyPct, freight, warrantyPct]);

  const updateMaterial = (index: number, field: keyof Material, value: number) => {
    setMaterials(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const totalProcurementSpend = result.procurementPlan.reduce((sum, p) => sum + p.spend, 0);

  // Chart data preparations
  const costBreakdownData = [
    { name: 'Direct Material', value: result.directMaterialCost, color: '#3B82F6' },
    { name: 'Labor', value: result.labor, color: '#10B981' },
    { name: 'Energy', value: result.energy, color: '#F59E0B' },
    { name: 'Freight', value: result.freight, color: '#8B5CF6' },
    { name: 'Warranty', value: result.warranty, color: '#EF4444' }
  ];

  const materialCostData = result.procurementPlan
    .filter(p => p.bomQty > 0)
    .map(p => ({
      name: p.name.split(' ')[0], // Shortened name
      cost: p.bomQty * p.avgCost,
      avgCost: p.avgCost,
      quantity: p.bomQty
    }))
    .sort((a, b) => b.cost - a.cost);

  const procurementSpendData = result.procurementPlan
    .filter(p => p.spend > 0)
    .map(p => ({
      name: p.name.split(' ')[0],
      spend: p.spend,
      quantity: p.procureQty,
      price: p.newPrice
    }))
    .sort((a, b) => b.spend - a.spend);

  // Sample trend data (in real app, this would come from historical data)
  const priceTrendData = [
    { month: 'Jan', copper: 780, steel: 140, plastic: 165 },
    { month: 'Feb', copper: 800, steel: 145, plastic: 170 },
    { month: 'Mar', copper: 830, steel: 148, plastic: 172 },
    { month: 'Apr', copper: 790, steel: 150, plastic: 175 },
    { month: 'May', copper: 820, steel: 152, plastic: 178 },
    { month: 'Jun', copper: 880, steel: 155, plastic: 180 },
  ];

  // Scenario comparison data 
  const [scenarios, setScenarios] = useState<Array<{name: string, result: any}>>([]);
  
  const addScenario = () => {
    const scenarioName = `Scenario ${scenarios.length + 1}`;
    setScenarios(prev => [...prev, { name: scenarioName, result: {...result} }]);
  };

  const clearScenarios = () => setScenarios([]);

  const scenarioComparisonData = scenarios.map(s => ({
    name: s.name,
    totalCost: s.result.totalCost,
    margin: s.result.marginPct * 100,
    directMaterial: s.result.directMaterialCost
  }));

  return (
    <div className="min-h-screen w-full p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ✨ Stabiliser Cost Simulator
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-white/40 backdrop-blur-lg rounded-full border border-white/30 shadow-lg">
            <span className="text-blue-700 font-medium">📊 Forecast + Inventory Analysis</span>
          </div>
        </motion.div>

        {/* Key Stats Row */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard label="Direct Material" value={rupees(result.directMaterialCost)} color="blue" />
          <StatsCard label="Total Cost" value={rupees(result.totalCost)} color="purple" />
          <StatsCard label="Margin" value={(result.marginPct * 100).toFixed(1) + "%"} color="green" />
          <StatsCard label="Recommended SP" value={rupees(result.recommendedSP)} color="orange" />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT: Inputs - Takes 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            {/* SKU Controls */}
            <GlassCard>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                🎯 Product Settings
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">SKU</Label>
                  <Select value={sku} onValueChange={(v) => {
                    setSku(v as keyof typeof PRODUCTS);
                    setTargetMargin(PRODUCTS[v as keyof typeof PRODUCTS].targetMargin);
                    setListPrice(PRODUCTS[v as keyof typeof PRODUCTS].listPrice);
                  }}>
                    <SelectTrigger className="bg-white/50 border-blue-200 focus:border-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCTS).map(([id, p]) => (
                        <SelectItem key={id} value={id}>{id} – {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Forecast Units</Label>
                  <Input 
                    type="number" 
                    value={forecastUnits} 
                    onChange={(e) => setForecastUnits(Number(e.target.value) || 0)}
                    className="bg-white/50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">List Price (₹)</Label>
                  <Input 
                    type="number" 
                    value={listPrice} 
                    onChange={(e) => setListPrice(Number(e.target.value) || 0)}
                    className="bg-white/50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium">Target Margin (%)</Label>
                  <Input 
                    type="number" 
                    value={Math.round(targetMargin * 100)} 
                    onChange={(e) => setTargetMargin(Number(e.target.value) / 100)}
                    className="bg-white/50 border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <h4 className="text-lg font-medium text-purple-700 mt-6 mb-3 flex items-center">
                ⚙️ Overheads
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InputField 
                  label="Labor % of DM" 
                  value={Math.round(laborPct * 100)}
                  onChange={(v) => setLaborPct(v / 100)}
                />
                <InputField 
                  label="Energy % of DM" 
                  value={Math.round(energyPct * 100)}
                  onChange={(v) => setEnergyPct(v / 100)}
                />
                <InputField 
                  label="Freight / Unit (₹)" 
                  value={freight}
                  onChange={setFreight}
                />
                <InputField 
                  label="Warranty % of SP" 
                  value={Math.round(warrantyPct * 100)}
                  onChange={(v) => setWarrantyPct(v / 100)}
                />
              </div>
            </GlassCard>

            {/* Materials Editor */}
            <GlassCard>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                📦 Materials & Inventory
              </h3>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {materials.map((material, index) => (
                  <MaterialRow 
                    key={material.id}
                    material={material}
                    avgCost={result.procurementPlan.find(p => p.id === material.id)?.avgCost || 0}
                    onUpdate={(field, value) => updateMaterial(index, field, value)}
                  />
                ))}
              </div>
            </GlassCard>
          </div>

          {/* RIGHT: Results - Takes 3 columns */}
          <div className="xl:col-span-3">
            <GlassCard>
              <Tabs defaultValue="procurement" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-white/30 mb-6">
                  <TabsTrigger value="procurement" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                    📋 Procurement
                  </TabsTrigger>
                  <TabsTrigger value="breakdown" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs">
                    📊 Breakdown
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs">
                    📈 Analysis
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs">
                    📊 Charts
                  </TabsTrigger>
                  <TabsTrigger value="scenarios" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-xs">
                    🔄 Scenarios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="procurement" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-blue-800">Procurement Plan</h3>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Procurement Spend</div>
                      <div className="text-2xl font-bold text-orange-600">{rupees(totalProcurementSpend)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-blue-700 font-semibold">
                        <tr className="border-b border-blue-200">
                          <th className="py-3 px-2 text-left">Material</th>
                          <th className="py-3 px-2 text-right">Gross Req</th>
                          <th className="py-3 px-2 text-right">On-hand</th>
                          <th className="py-3 px-2 text-right">Procure</th>
                          <th className="py-3 px-2 text-right">Spend</th>
                          <th className="py-3 px-2 text-right">Avg Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.procurementPlan.map((plan) => (
                          <tr key={plan.id} className="border-b border-blue-100 hover:bg-blue-50/50">
                            <td className="py-3 px-2 font-medium text-gray-800">{plan.name}</td>
                            <td className="py-3 px-2 text-right">{plan.grossReq.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right text-green-600">{plan.onHand.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right text-orange-600">{plan.procureQty.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-semibold">{rupees(plan.spend)}</td>
                            <td className="py-3 px-2 text-right text-purple-600 font-semibold">{rupees(plan.avgCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="space-y-4">
                  <h3 className="text-xl font-semibold text-purple-800">Cost Breakdown</h3>
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <CostItem label="Direct Material" value={rupees(result.directMaterialCost)} color="blue" />
                      <CostItem label="Labor" value={rupees(result.labor)} color="green" />
                      <CostItem label="Energy" value={rupees(result.energy)} color="yellow" />
                      <CostItem label="Freight" value={rupees(result.freight)} color="purple" />
                      <CostItem label="Warranty" value={rupees(result.warranty)} color="pink" />
                      <CostItem label="Total Unit Cost" value={rupees(result.totalCost)} color="indigo" large />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-800">Profitability Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Current Scenario</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>List Price:</span>
                          <span className="font-semibold">{rupees(result.listPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span className="font-semibold">{rupees(result.totalCost)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Margin:</span>
                          <span className="font-bold text-lg">{rupees(result.marginInr)} ({(result.marginPct * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Recommendation</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Target Margin:</span>
                          <span className="font-semibold">{(result.targetMargin * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recommended SP:</span>
                          <span className="font-bold text-xl text-green-600">{rupees(result.recommendedSP)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-4">
                          {result.listPrice < result.recommendedSP ? 
                            "💡 Consider increasing the selling price to achieve target margin." :
                            "✅ Current price meets target margin requirements."
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="charts" className="space-y-6">
                  <h3 className="text-xl font-semibold text-orange-800">Visual Analytics</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Breakdown Pie Chart */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">💰 Cost Breakdown</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={costBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {costBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [rupees(Number(value)), '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Material Costs Bar Chart */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">🔧 Material Costs per Unit</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={materialCostData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [rupees(Number(value)), 'Cost per Unit']}
                            labelFormatter={(label) => `Material: ${label}`}
                          />
                          <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Procurement Spend Chart */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">🛒 Procurement Spend</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={procurementSpendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [rupees(Number(value)), 'Procurement Spend']}
                            labelFormatter={(label) => `Material: ${label}`}
                          />
                          <Bar dataKey="spend" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Price Trends */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Price Trends (6M)</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={priceTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis dataKey="month" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="copper" stroke="#EF4444" strokeWidth={3} name="Copper (₹/kg)" />
                          <Line type="monotone" dataKey="steel" stroke="#8B5CF6" strokeWidth={3} name="Steel (₹/kg)" />
                          <Line type="monotone" dataKey="plastic" stroke="#10B981" strokeWidth={3} name="Plastic (₹/kg)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scenarios" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-pink-800">🔄 Scenario Comparison</h3>
                    <div className="space-x-2">
                      <Button 
                        onClick={addScenario}
                        className="bg-pink-500 hover:bg-pink-600 text-white"
                      >
                        ➕ Add Current Scenario
                      </Button>
                      <Button 
                        onClick={clearScenarios}
                        variant="outline"
                        className="border-pink-300 text-pink-700 hover:bg-pink-50"
                      >
                        🗑️ Clear All
                      </Button>
                    </div>
                  </div>

                  {scenarios.length === 0 ? (
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-8 text-center">
                      <div className="text-gray-500 text-lg mb-2">📊 No scenarios saved yet</div>
                      <div className="text-gray-400 text-sm">
                        Adjust your parameters above and click "Add Current Scenario" to compare different configurations
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Scenario Comparison Chart */}
                      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">💹 Cost & Margin Comparison</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={scenarioComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis yAxisId="cost" orientation="left" fontSize={12} />
                            <YAxis yAxisId="margin" orientation="right" fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="cost" dataKey="totalCost" fill="#3B82F6" name="Total Cost (₹)" />
                            <Bar yAxisId="cost" dataKey="directMaterial" fill="#10B981" name="Direct Material (₹)" />
                            <Line yAxisId="margin" type="monotone" dataKey="margin" stroke="#EF4444" strokeWidth={3} name="Margin %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Scenario Summary Table */}
                      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 Scenario Summary</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="text-blue-700 font-semibold border-b border-blue-200">
                              <tr>
                                <th className="py-3 px-2 text-left">Scenario</th>
                                <th className="py-3 px-2 text-right">Total Cost</th>
                                <th className="py-3 px-2 text-right">Direct Material</th>
                                <th className="py-3 px-2 text-right">Margin %</th>
                                <th className="py-3 px-2 text-right">Recommended SP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scenarios.map((scenario, index) => (
                                <tr key={index} className="border-b border-blue-100 hover:bg-blue-50/50">
                                  <td className="py-3 px-2 font-medium">{scenario.name}</td>
                                  <td className="py-3 px-2 text-right">{rupees(scenario.result.totalCost)}</td>
                                  <td className="py-3 px-2 text-right">{rupees(scenario.result.directMaterialCost)}</td>
                                  <td className="py-3 px-2 text-right">{(scenario.result.marginPct * 100).toFixed(1)}%</td>
                                  <td className="py-3 px-2 text-right font-semibold text-green-600">{rupees(scenario.result.recommendedSP)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6"
    >
      {children}
    </motion.div>
  );
}

function StatsCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600", 
    green: "from-green-400 to-green-600",
    orange: "from-orange-400 to-orange-600"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/40 backdrop-blur-lg rounded-xl border border-white/30 shadow-lg p-4"
    >
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-xl font-bold bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} bg-clip-text text-transparent`}>
        {value}
      </div>
    </motion.div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-blue-700">{label}</Label>
      <Input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="bg-white/50 border-blue-200 focus:border-blue-400 text-sm"
      />
    </div>
  );
}

function MaterialRow({ 
  material, 
  avgCost, 
  onUpdate 
}: { 
  material: Material; 
  avgCost: number; 
  onUpdate: (field: keyof Material, value: number) => void;
}) {
  return (
    <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
      <div className="text-sm font-semibold text-blue-800 mb-2">{material.name}</div>
      <div className="grid grid-cols-3 gap-2">
        <InputField 
          label="New Price" 
          value={material.newPrice}
          onChange={(v) => onUpdate('newPrice', v)}
        />
        <InputField 
          label="On-hand" 
          value={material.onHand}
          onChange={(v) => onUpdate('onHand', v)}
        />
        <InputField 
          label="BOM Qty" 
          value={material.bomQty}
          onChange={(v) => onUpdate('bomQty', v)}
        />
      </div>
      <div className="mt-2 text-xs text-purple-600">
        Avg Cost: <span className="font-semibold">{rupees(avgCost)}</span> | UoM: {material.uom}
      </div>
    </div>
  );
}

function CostItem({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    indigo: "text-indigo-600"
  };

  return (
    <div className={large ? "col-span-2 border-t pt-4" : ""}>
      <div className="flex justify-between items-center">
        <span className={large ? "font-bold text-lg" : ""}>{label}</span>
        <span className={`font-semibold ${colorClasses[color as keyof typeof colorClasses]} ${large ? "text-xl" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}