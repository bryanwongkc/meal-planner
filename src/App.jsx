import React, { useState } from 'react';
import { 
  ChefHat, Utensils, ShoppingBasket, Flame, Clock, 
  AlertCircle, Loader2, ListChecks, MessageSquare, 
  RefreshCcw, Plus, Trash2, Globe, Sparkles, Zap, Edit3, Undo2,
  ShieldCheck, XCircle, Info, Settings2, Users, Baby, LayoutGrid
} from 'lucide-react';

const PROTEIN_OPTIONS = [
  "Pork (Pork Belly, Sliced Pork)",
  "Chicken (Thighs, Breast, Wings)",
  "Beef (Flank, Sirloin, Short Ribs)",
  "Tofu (Firm, Soft, Silken)",
  "Fish (Whole, Fillets)",
  "Shrimp / Prawns",
  "Duck",
  "Eggs",
  "Scallops",
  "Lamb",
  "CUSTOM_VAL"
];

const FIBER_OPTIONS = [
  "Bok Choy",
  "Gai Lan (Chinese Broccoli)",
  "Cabbage (Napa or Green)",
  "Eggplant",
  "Mushrooms (Shiitake, Enoki, Oyster)",
  "Green Beans",
  "Snow Peas",
  "Bell Peppers",
  "Lotus Root",
  "Potato",
  "Cucumber",
  "CUSTOM_VAL"
];

const LOCATIONS = [
  { value: "supermarket", label: "Supermarket" },
  { value: "wet market", label: "Wet Market" }
];

const DIFFICULTIES = [
  { value: "Very Easy", label: "Very Easy (Fusion/Western only)", note: "No-cook or 1-pan assembly" },
  { value: "Easy", label: "Easy", note: "Simple stir-fry or sear" },
  { value: "Medium", label: "Medium", note: "Standard prep & marinating" },
  { value: "Hard", label: "Hard", note: "Complex techniques & braising" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('menu');
  const [dishCount, setDishCount] = useState(3);
  const [dinerCount, setDinerCount] = useState(3);
  const [isToddlerFriendly, setIsToddlerFriendly] = useState(false);
  const [styleWeight, setStyleWeight] = useState(0); 
  const [proteins, setProteins] = useState([{ value: PROTEIN_OPTIONS[0], customText: "" }]);
  const [fibers, setFibers] = useState([{ value: FIBER_OPTIONS[0], customText: "" }]);
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].value);

  const [standardRules, setStandardRules] = useState([
    { id: 'no-spicy', label: 'No Spicy Food', active: true, description: 'Chef will avoid all chili and heat.' },
    { id: 'one-veg', label: '1x Strictly Vegetarian', active: true, description: 'Exactly one dish must be meat-free.' }
  ]);
  const [customRules, setCustomRules] = useState([]);
  const [newRuleInput, setNewRuleInput] = useState("");

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followUpComment, setFollowUpComment] = useState("");

  const toggleStandardRule = (id) => {
    setStandardRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const addCustomRule = () => {
    if (!newRuleInput.trim()) return;
    setCustomRules([...customRules, { id: Date.now(), text: newRuleInput.trim() }]);
    setNewRuleInput("");
  };

  const removeCustomRule = (id) => {
    setCustomRules(customRules.filter(r => r.id !== id));
  };

  const addIngredient = (type) => {
    const newItem = { value: type === 'protein' ? PROTEIN_OPTIONS[0] : FIBER_OPTIONS[0], customText: "" };
    if (type === 'protein' && proteins.length < 4) setProteins([...proteins, newItem]);
    else if (type === 'fiber' && fibers.length < 4) setFibers([...fibers, newItem]);
  };

  const removeIngredient = (type, index) => {
    if (type === 'protein' && proteins.length > 1) setProteins(proteins.filter((_, i) => i !== index));
    else if (type === 'fiber' && fibers.length > 1) setFibers(fibers.filter((_, i) => i !== index));
  };

  const updateIngredient = (type, index, field, value) => {
    const target = type === 'protein' ? proteins : fibers;
    const setter = type === 'protein' ? setProteins : setFibers;
    const newArr = [...target];
    newArr[index][field] = value;
    setter(newArr);
  };

  const getStyleLabel = (val) => {
    if (val < -60) return "Authentic Chinese";
    if (val < -20) return "Chinese-leaning Fusion";
    if (val <= 20) return "Global Fusion";
    if (val <= 60) return "Western-leaning Fusion";
    return "Modern Western Style";
  };

  const generateRecipes = async (isRefinement = false) => {
    setLoading(true);
    setError("");
    
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const activeRules = [
      ...standardRules.filter(r => r.active).map(r => r.label),
      ...customRules.map(r => r.text)
    ];

    const finalProteins = proteins.map(p => p.value === "CUSTOM_VAL" ? p.customText : p.value).filter(v => v);
    const finalFibers = fibers.map(f => f.value === "CUSTOM_VAL" ? f.customText : f.value).filter(v => v);

    let prompt = "";
    const toddlerInstruction = isToddlerFriendly ? "Include a 'toddlerAdaptation' string for each dish (how to prep portions for a toddler: reducing seasoning, cutting size, or setting aside before spicy/salty sauces)." : "";
    
    if (isRefinement) {
      prompt = `
        Refine the following menu: ${JSON.stringify(recipes)}
        FEEDBACK: "${followUpComment}"
        DINERS: ${dinerCount}
        TASK: Modify ONLY specific dishes. Keep others exactly the same.
        DIETARY: ${activeRules.join(", ")}. 
        TODDLER MODE: ${isToddlerFriendly ? "ON - ensure toddlerAdaptation field is updated if relevant." : "OFF"}
        STYLE: ${getStyleLabel(styleWeight)}. 
        DIFFICULTY: ${difficulty}.
      `;
    } else {
      prompt = `
        Executive Chef Role. Create ${dishCount} recipes for ${dinerCount} diners.
        STYLE: ${getStyleLabel(styleWeight)}
        DIFFICULTY: ${difficulty}
        INGREDIENTS: Proteins (${finalProteins.join(", ")}); Fibers (${finalFibers.join(", ")})
        RULES: ${activeRules.join(", ")}
        SHOPPING: ${location}
        ${toddlerInstruction}
      `;
    }

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              chineseName: { type: "STRING" },
              styleTag: { type: "STRING" },
              description: { type: "STRING" },
              prepTime: { type: "STRING" },
              cookTime: { type: "STRING" },
              ingredients: { type: "ARRAY", items: { type: "STRING" } },
              instructions: { type: "ARRAY", items: { type: "STRING" } },
              toddlerAdaptation: { type: "STRING" }
            },
            required: ["name", "styleTag", "description", "prepTime", "cookTime", "ingredients", "instructions"]
          }
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setRecipes(JSON.parse(resultText));
        if (isRefinement) setFollowUpComment("");
      }
    } catch (err) {
      setError("Chef is busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 pb-20 font-sans">
      <header className="bg-indigo-950 text-white py-12 px-4 shadow-2xl relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="flex items-center space-x-6">
            <div className="bg-white/10 p-4 rounded-[2.5rem] border border-white/20">
              <ChefHat className="text-orange-400" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter italic">Culina<span className="text-orange-400">Fusion</span></h1>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Tailored Gastronomy Engine</p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex items-center bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-sm">
             <div className="flex items-center space-x-2 border-r border-white/10 pr-4 mr-4">
                <Users size={16} className="text-indigo-300" />
                <span className="text-xs font-black">{dinerCount} Diners</span>
             </div>
             <div className="flex items-center space-x-2">
                <Baby size={16} className={isToddlerFriendly ? "text-orange-400" : "text-white/20"} />
                <span className={`text-[10px] font-black uppercase ${isToddlerFriendly ? "text-orange-400" : "text-white/40"}`}>Toddler Mode {isToddlerFriendly ? "Active" : "Off"}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-stone-200 border border-stone-100 overflow-hidden mb-12">
          <div className="flex bg-stone-50 border-b border-stone-100 p-2">
            <button onClick={() => setActiveTab('menu')} className={`flex-1 py-5 px-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>The Pantry</button>
            <button onClick={() => setActiveTab('rules')} className={`flex-1 py-5 px-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'rules' ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Dietary Rules</button>
          </div>

          <div className="p-8 md:p-14">
            {activeTab === 'menu' ? (
              <div className="space-y-12">
                {/* Sliders Area - 3 Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                        <label className="font-black text-stone-400 uppercase tracking-widest text-[10px] flex items-center"><LayoutGrid size={14} className="mr-2"/> Dishes</label>
                        <span className="text-indigo-900 font-black text-xl">{dishCount}</span>
                    </div>
                    <input type="range" min="1" max="6" step="1" value={dishCount} onChange={(e) => setDishCount(parseInt(e.target.value))} className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                        <label className="font-black text-stone-400 uppercase tracking-widest text-[10px] flex items-center"><Users size={14} className="mr-2"/> Diners</label>
                        <span className="text-indigo-900 font-black text-xl">{dinerCount}</span>
                    </div>
                    <input type="range" min="2" max="8" step="1" value={dinerCount} onChange={(e) => setDinerCount(parseInt(e.target.value))} className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center"><label className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Flavor Weight</label><span className="text-indigo-600 font-bold text-xs">{getStyleLabel(styleWeight)}</span></div>
                    <input type="range" min="-100" max="100" step="20" value={styleWeight} onChange={(e) => setStyleWeight(parseInt(e.target.value))} className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-400"/>
                  </div>
                </div>

                {/* Main Ingredients Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 border-t border-stone-100">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3"><h3 className="font-black text-xs uppercase flex items-center text-stone-800"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2"></span>Proteins</h3><button onClick={() => addIngredient('protein')} className="p-1.5 rounded-xl bg-indigo-950 text-white transition-transform active:scale-90" disabled={proteins.length >= 4}><Plus size={14}/></button></div>
                    {proteins.map((p, i) => (
                      <div key={i} className="flex flex-col space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                        <div className="flex items-center space-x-2">
                          <select className="flex-1 p-1 bg-transparent text-sm font-bold outline-none" value={p.value} onChange={(e) => updateIngredient('protein', i, 'value', e.target.value)}>
                            {PROTEIN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === "CUSTOM_VAL" ? "✨ Custom..." : opt}</option>)}
                          </select>
                          {proteins.length > 1 && <button onClick={() => removeIngredient('protein', i)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16}/></button>}
                        </div>
                        {p.value === "CUSTOM_VAL" && <input type="text" placeholder="Protein name..." className="p-2 text-sm bg-white border border-stone-200 rounded-xl outline-none" value={p.customText} onChange={(e) => updateIngredient('protein', i, 'customText', e.target.value)} />}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3"><h3 className="font-black text-xs uppercase flex items-center text-stone-800"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>Veggies</h3><button onClick={() => addIngredient('fiber')} className="p-1.5 rounded-xl bg-indigo-950 text-white transition-transform active:scale-90" disabled={fibers.length >= 4}><Plus size={14}/></button></div>
                    {fibers.map((f, i) => (
                      <div key={i} className="flex flex-col space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                        <div className="flex items-center space-x-2">
                          <select className="flex-1 p-1 bg-transparent text-sm font-bold outline-none" value={f.value} onChange={(e) => updateIngredient('fiber', i, 'value', e.target.value)}>
                            {FIBER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === "CUSTOM_VAL" ? "✨ Custom..." : opt}</option>)}
                          </select>
                          {fibers.length > 1 && <button onClick={() => removeIngredient('fiber', i)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16}/></button>}
                        </div>
                        {f.value === "CUSTOM_VAL" && <input type="text" placeholder="Veggie name..." className="p-2 text-sm bg-white border border-stone-200 rounded-xl outline-none" value={f.customText} onChange={(e) => updateIngredient('fiber', i, 'customText', e.target.value)} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kitchen Settings & Toddler Toggle */}
                <div className="pt-10 border-t border-stone-100 space-y-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-indigo-950 uppercase text-[10px] tracking-widest flex items-center">
                        <Settings2 size={16} className="mr-2 text-indigo-400" /> Prep Strategy
                    </h3>
                    <div className="flex items-center bg-stone-50 p-1 rounded-2xl border border-stone-100">
                        <button 
                            onClick={() => setIsToddlerFriendly(false)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isToddlerFriendly ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400'}`}
                        >
                            Adults Only
                        </button>
                        <button 
                            onClick={() => setIsToddlerFriendly(true)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center ${isToddlerFriendly ? 'bg-orange-400 text-white shadow-sm' : 'text-stone-400'}`}
                        >
                            <Baby size={12} className="mr-1.5" /> Toddler Friendly
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Technique Level</label>
                      <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold border-none bg-stone-100 text-stone-700">
                        {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Supply Source</label>
                      <select value={location} onChange={e => setLocation(e.target.value)} className="w-full p-4 bg-stone-100 rounded-2xl text-sm font-bold border-none text-stone-700">
                        {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="font-black text-indigo-950 uppercase text-xs tracking-widest flex items-center">
                    <ShieldCheck size={16} className="mr-2 text-indigo-600" /> Standard Safety Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standardRules.map(rule => (
                      <button 
                        key={rule.id}
                        onClick={() => toggleStandardRule(rule.id)}
                        className={`p-6 rounded-[2rem] border text-left transition-all ${rule.active ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-stone-50 border-stone-100'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-black text-sm ${rule.active ? 'text-indigo-900' : 'text-stone-400'}`}>{rule.label}</span>
                          <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-indigo-600 animate-pulse' : 'bg-stone-300'}`}></div>
                        </div>
                        <p className="text-[10px] font-medium text-stone-500 leading-tight">{rule.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-stone-100">
                  <h3 className="font-black text-indigo-950 uppercase text-xs tracking-widest flex items-center">
                    <Plus size={16} className="mr-2 text-indigo-600" /> Custom Restrictions
                  </h3>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 'No Shellfish', 'Low Sodium'..." 
                      className="flex-1 p-4 bg-stone-50 rounded-2xl border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomRule()}
                    />
                    <button onClick={addCustomRule} className="bg-indigo-950 text-white px-6 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-colors hover:bg-indigo-900">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customRules.map(rule => (
                      <div key={rule.id} className="flex items-center bg-orange-50 text-orange-900 border border-orange-100 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                        <span>{rule.text}</span>
                        <button onClick={() => removeCustomRule(rule.id)} className="ml-2 text-orange-400 hover:text-orange-600"><XCircle size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => generateRecipes(false)} disabled={loading} className="w-full mt-12 bg-indigo-950 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center space-x-4 shadow-2xl transition-all active:scale-95 disabled:bg-stone-300">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="text-orange-400" size={24} />}
              <span className="uppercase tracking-[0.3em] text-sm">{loading ? "Simulating..." : "Construct Menu"}</span>
            </button>
          </div>
        </div>

        {recipes.length > 0 && (
          <div className="space-y-12 pb-20">
            <h2 className="text-3xl font-black text-indigo-950 tracking-tighter px-4">Executive Menu</h2>
            <div className="grid grid-cols-1 gap-10">
              {recipes.map((r, i) => (
                <div key={i} className="bg-white rounded-[4rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col transition-all hover:border-indigo-200 group">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 p-12 bg-stone-50/50 border-r border-stone-100">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 block">{r.styleTag}</span>
                        <h3 className="text-2xl font-black text-stone-900 leading-tight mb-2">{r.name}</h3>
                        <p className="font-serif text-lg text-indigo-800/40 mb-8 italic">{r.chineseName}</p>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center text-[10px] font-black text-stone-400 uppercase tracking-widest bg-white border border-stone-100 px-3 py-1.5 rounded-full"><Clock size={12} className="mr-2" /> {r.prepTime}</div>
                            <div className="flex items-center text-[10px] font-black text-stone-400 uppercase tracking-widest bg-white border border-stone-100 px-3 py-1.5 rounded-full"><Flame size={12} className="mr-2" /> {r.cookTime}</div>
                        </div>
                    </div>
                    <div className="md:w-2/3 p-12 flex flex-col justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h4 className="text-[10px] font-black text-stone-400 uppercase mb-5 border-b pb-2">Ingredients</h4>
                            <ul className="text-sm space-y-2 font-bold text-stone-700">{r.ingredients.map((ing, j) => <li key={j} className="flex items-start"><span className="text-indigo-400 mr-2">/</span>{ing}</li>)}</ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-stone-400 uppercase mb-5 border-b pb-2">Execution</h4>
                            <ol className="text-sm space-y-4">{r.instructions.map((step, j) => <li key={j} className="flex space-x-3"><span className="text-indigo-950 font-black text-xs pt-0.5">{j+1}.</span><span className="text-stone-500 font-medium leading-relaxed">{step}</span></li>)}</ol>
                        </div>
                        </div>
                    </div>
                  </div>
                  {r.toddlerAdaptation && (
                    <div className="bg-orange-50/50 border-t border-orange-100 p-8 flex items-start space-x-6">
                        <div className="bg-orange-400 p-3 rounded-2xl text-white shadow-lg shadow-orange-200">
                            <Baby size={24} />
                        </div>
                        <div>
                            <h5 className="font-black text-orange-900 text-xs uppercase tracking-widest mb-1 italic">Toddler Adaptation Advice</h5>
                            <p className="text-sm text-orange-800 leading-relaxed font-medium">{r.toddlerAdaptation}</p>
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-indigo-950 rounded-[4rem] p-12 text-white shadow-3xl relative">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 text-orange-400 mb-3 font-black uppercase tracking-widest text-[10px]"><Undo2 size={16} /> <span>Surgical Tweak</span></div>
                <h3 className="text-2xl font-black mb-6">Refine specific dishes?</h3>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <textarea className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-white/20" rows="2" placeholder="e.g. 'Swap salmon for sea bass'..." value={followUpComment} onChange={e => setFollowUpComment(e.target.value)} />
                  <button onClick={() => generateRecipes(true)} disabled={loading || !followUpComment.trim()} className="bg-orange-400 text-indigo-950 font-black px-12 py-5 rounded-[2rem] hover:bg-orange-300 transition-all flex items-center justify-center space-x-3 disabled:opacity-20"><RefreshCcw size={20} /> <span className="uppercase text-xs tracking-widest">Update</span></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}