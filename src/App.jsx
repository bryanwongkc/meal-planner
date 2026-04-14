import React, { useState } from 'react';
import {
  Baby, ChefHat, Clock, Flame, LayoutGrid, Loader2, Monitor,
  Plus, RefreshCcw, Settings2, ShieldCheck, Smartphone, Sparkles,
  Trash2, Undo2, Users, XCircle
} from 'lucide-react';

const PROTEIN_OPTIONS = ['Pork (Pork Belly, Sliced Pork)', 'Chicken (Thighs, Breast, Wings)', 'Beef (Flank, Sirloin, Short Ribs)', 'Tofu (Firm, Soft, Silken)', 'Fish (Whole, Fillets)', 'Shrimp / Prawns', 'Duck', 'Eggs', 'Scallops', 'Lamb', 'CUSTOM_VAL'];
const FIBER_OPTIONS = ['Bok Choy', 'Gai Lan (Chinese Broccoli)', 'Cabbage (Napa or Green)', 'Eggplant', 'Mushrooms (Shiitake, Enoki, Oyster)', 'Green Beans', 'Snow Peas', 'Bell Peppers', 'Lotus Root', 'Potato', 'Cucumber', 'CUSTOM_VAL'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const LOCATIONS = [{ value: 'supermarket', label: 'Supermarket' }, { value: 'wet market', label: 'Wet Market' }];
const DIFFICULTIES = [{ value: 'Very Easy', label: 'Very Easy (Fusion/Western only)' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }];

const card = 'rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm';

function Section({ title, icon: Icon, children }) {
  return (
    <section className={card}>
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-2xl bg-stone-100 p-2 text-indigo-900"><Icon size={16} /></div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-500">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function IngredientBlock({ title, items, options, type, dot, addIngredient, removeIngredient, updateIngredient }) {
  return (
    <Section title={title} icon={Plus}>
      <div className="mb-4 flex items-center justify-between">
        <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <button onClick={() => addIngredient(type)} className="rounded-xl bg-indigo-950 p-2 text-white" disabled={items.length >= 4}><Plus size={14} /></button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${type}-${index}`} className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
            <div className="flex items-center gap-2">
              <select className="min-w-0 flex-1 bg-transparent text-sm font-bold text-stone-700 outline-none" value={item.value} onChange={(e) => updateIngredient(type, index, 'value', e.target.value)}>
                {options.map((option) => <option key={option} value={option}>{option === 'CUSTOM_VAL' ? 'Custom...' : option}</option>)}
              </select>
              {items.length > 1 && <button onClick={() => removeIngredient(type, index)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16} /></button>}
            </div>
            {item.value === 'CUSTOM_VAL' && <input type="text" placeholder={type === 'protein' ? 'Protein name...' : 'Veggie name...'} className="mt-3 w-full rounded-xl border border-stone-200 bg-white p-2 text-sm outline-none" value={item.customText} onChange={(e) => updateIngredient(type, index, 'customText', e.target.value)} />}
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function App() {
  const [layoutMode, setLayoutMode] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [activeTab, setActiveTab] = useState('menu');
  const [dishCount, setDishCount] = useState(3);
  const [dinerCount, setDinerCount] = useState(3);
  const [isToddlerFriendly, setIsToddlerFriendly] = useState(false);
  const [styleWeight, setStyleWeight] = useState(0);
  const [flavorHealthBalance, setFlavorHealthBalance] = useState(50);
  const [proteins, setProteins] = useState([{ value: PROTEIN_OPTIONS[0], customText: '' }]);
  const [fibers, setFibers] = useState([{ value: FIBER_OPTIONS[0], customText: '' }]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]);
  const [todayPreference, setTodayPreference] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].value);
  const [dietaryRules, setDietaryRules] = useState([
    { id: 'no-spicy', text: 'No Spicy Food' },
    { id: 'one-veg', text: '1x Strictly Vegetarian' }
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followUpComment, setFollowUpComment] = useState('');

  const isMobileLayout = layoutMode === 'mobile';
  const trackClass = 'w-full cursor-pointer accent-indigo-600';

  const saveCustomRule = () => {
    if (!newRuleInput.trim()) return;
    if (editingRuleId !== null) {
      setDietaryRules(dietaryRules.map((rule) => (
        rule.id === editingRuleId ? { ...rule, text: newRuleInput.trim() } : rule
      )));
      setEditingRuleId(null);
    } else {
      setDietaryRules([...dietaryRules, { id: Date.now(), text: newRuleInput.trim() }]);
    }
    setNewRuleInput('');
  };
  const startEditingRule = (rule) => {
    setEditingRuleId(rule.id);
    setNewRuleInput(rule.text);
  };
  const cancelEditingRule = () => {
    setEditingRuleId(null);
    setNewRuleInput('');
  };
  const removeCustomRule = (id) => {
    setDietaryRules(dietaryRules.filter((rule) => rule.id !== id));
    if (editingRuleId === id) cancelEditingRule();
  };
  const addIngredient = (type) => {
    const entry = { value: type === 'protein' ? PROTEIN_OPTIONS[0] : FIBER_OPTIONS[0], customText: '' };
    if (type === 'protein' && proteins.length < 4) setProteins([...proteins, entry]);
    if (type === 'fiber' && fibers.length < 4) setFibers([...fibers, entry]);
  };
  const removeIngredient = (type, index) => {
    if (type === 'protein' && proteins.length > 1) setProteins(proteins.filter((_, i) => i !== index));
    if (type === 'fiber' && fibers.length > 1) setFibers(fibers.filter((_, i) => i !== index));
  };
  const updateIngredient = (type, index, field, value) => {
    const target = type === 'protein' ? proteins : fibers;
    const setter = type === 'protein' ? setProteins : setFibers;
    const next = [...target];
    next[index][field] = value;
    setter(next);
  };

  const getStyleLabel = (value) => {
    if (value < -60) return 'Authentic Chinese';
    if (value < -20) return 'Chinese-leaning Fusion';
    if (value <= 20) return 'Global Fusion';
    if (value <= 60) return 'Western-leaning Fusion';
    return 'Modern Western Style';
  };

  const getFlavorHealthLabel = (value) => {
    if (value <= 20) return 'Very light and health-focused';
    if (value <= 40) return 'Balanced toward lighter cooking';
    if (value <= 60) return 'Balanced flavor and nutrition';
    if (value <= 80) return 'Richer and more indulgent';
    return 'Maximum richness and flavor';
  };

  const generateRecipes = async (isRefinement = false) => {
    setLoading(true);
    setError('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const primaryModel = 'gemini-3.1-flash-lite-preview';
    const fallbackModel = 'gemini-2.5-flash';
    if (!apiKey) {
      setError('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      setLoading(false);
      return;
    }
    const activeRules = dietaryRules.map((rule) => rule.text);
    const finalProteins = proteins.map((p) => (p.value === 'CUSTOM_VAL' ? p.customText : p.value)).filter(Boolean);
    const finalFibers = fibers.map((f) => (f.value === 'CUSTOM_VAL' ? f.customText : f.value)).filter(Boolean);
    const toddlerInstruction = isToddlerFriendly ? "Include a 'toddlerAdaptation' string for each dish." : '';
    const preferenceInstruction = todayPreference.trim() ? `TODAY PREFERENCE: ${todayPreference.trim()}.` : '';
    const flavorHealthInstruction = `FLAVOR VS HEALTH: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)}). Reflect this balance in ingredient choices, cooking method, seasoning intensity, richness, and oil or sauce usage.`;
    const prompt = isRefinement
      ? `Refine the following menu: ${JSON.stringify(recipes)} FEEDBACK: "${followUpComment}" DINERS: ${dinerCount} TASK: Modify ONLY specific dishes. Keep others exactly the same. MEAL TYPE: ${mealType}. ${preferenceInstruction} ${flavorHealthInstruction} DIETARY: ${activeRules.join(', ')}. TODDLER MODE: ${isToddlerFriendly ? 'ON - update toddlerAdaptation if relevant.' : 'OFF'} STYLE: ${getStyleLabel(styleWeight)}. DIFFICULTY: ${difficulty}.`
      : `Executive Chef Role. Create ${dishCount} recipes for ${dinerCount} diners. MEAL TYPE: ${mealType}. ${preferenceInstruction} ${flavorHealthInstruction} STYLE: ${getStyleLabel(styleWeight)} DIFFICULTY: ${difficulty} INGREDIENTS: Proteins (${finalProteins.join(', ')}); Fibers (${finalFibers.join(', ')}) RULES: ${activeRules.join(', ')} SHOPPING: ${location} ${toddlerInstruction}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, chineseName: { type: 'STRING' }, styleTag: { type: 'STRING' }, description: { type: 'STRING' }, prepTime: { type: 'STRING' }, cookTime: { type: 'STRING' }, ingredients: { type: 'ARRAY', items: { type: 'STRING' } }, instructions: { type: 'ARRAY', items: { type: 'STRING' } }, toddlerAdaptation: { type: 'STRING' } }, required: ['name', 'styleTag', 'description', 'prepTime', 'cookTime', 'ingredients', 'instructions'] } } } };
    const requestRecipes = async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      return { response, data };
    };

    try {
      let { response, data } = await requestRecipes(primaryModel);
      if (response.status === 503) {
        ({ response, data } = await requestRecipes(fallbackModel));
      }
      if (!response.ok) throw new Error(`API call failed with status ${response.status}`);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setRecipes(JSON.parse(resultText));
        if (isRefinement) setFollowUpComment('');
      } else {
        throw new Error('API returned no recipe payload');
      }
    } catch {
      setError('Gemini request failed. Primary model is tried first; on 503 the app falls back to Gemini 2.5 Flash.');
    } finally {
      setLoading(false);
    }
  };

  const menuContent = (
    <div className="space-y-5">
      <Section title="Meal Profile" icon={LayoutGrid}>
        <div className={`grid gap-5 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Dishes</label><span className="text-xl font-black text-indigo-900">{dishCount}</span></div><input type="range" min="1" max="6" step="1" value={dishCount} onChange={(e) => setDishCount(parseInt(e.target.value, 10))} className={trackClass} /></div>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Diners</label><span className="text-xl font-black text-indigo-900">{dinerCount}</span></div><input type="range" min="2" max="8" step="1" value={dinerCount} onChange={(e) => setDinerCount(parseInt(e.target.value, 10))} className={trackClass} /></div>
          <div className="space-y-3"><div className="flex items-center justify-between gap-4"><label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Flavor Weight</label><span className="text-xs font-bold text-orange-500">{getStyleLabel(styleWeight)}</span></div><input type="range" min="-100" max="100" step="20" value={styleWeight} onChange={(e) => setStyleWeight(parseInt(e.target.value, 10))} className="w-full cursor-pointer accent-orange-400" /></div>
        </div>
      </Section>
      <div className={`grid gap-5 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <IngredientBlock title="Proteins" items={proteins} options={PROTEIN_OPTIONS} type="protein" dot="bg-rose-500" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} />
        <IngredientBlock title="Veggies" items={fibers} options={FIBER_OPTIONS} type="fiber" dot="bg-emerald-500" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} />
      </div>
      <Section title="Kitchen Settings" icon={Settings2}>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Meal Type</label>
            <div className="flex rounded-2xl border border-stone-100 bg-stone-50 p-1">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest ${
                    mealType === type ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Today Preference</label>
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-1.5">
              <input
                type="text"
                placeholder="e.g. soupy, light, comforting, crispy..."
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-700 outline-none ring-1 ring-transparent placeholder:text-stone-400 focus:ring-indigo-500"
                value={todayPreference}
                onChange={(e) => setTodayPreference(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Flavor vs Health</label>
              <span className="text-xs font-bold text-orange-500">{getFlavorHealthLabel(flavorHealthBalance)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={flavorHealthBalance}
              onChange={(e) => setFlavorHealthBalance(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-orange-400"
            />
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
              <span>Healthier / lighter</span>
              <span>{flavorHealthBalance}</span>
              <span>Richer / flavorful</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black text-stone-800">Service Mode</p><p className="text-xs font-medium text-stone-500">Switch toddler-safe guidance on or off.</p></div>
            <div className="flex items-center rounded-2xl border border-stone-100 bg-stone-50 p-1">
              <button onClick={() => setIsToddlerFriendly(false)} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase ${!isToddlerFriendly ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400'}`}>Adults Only</button>
              <button onClick={() => setIsToddlerFriendly(true)} className={`flex items-center rounded-xl px-4 py-2 text-[10px] font-black uppercase ${isToddlerFriendly ? 'bg-orange-400 text-white shadow-sm' : 'text-stone-400'}`}><Baby size={12} className="mr-1.5" />Toddler</button>
            </div>
          </div>
          <div className={`grid gap-4 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Technique Level</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-2xl bg-stone-100 p-4 text-sm font-bold text-stone-700">{DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Supply Source</label><select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl bg-stone-100 p-4 text-sm font-bold text-stone-700">{LOCATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          </div>
        </div>
      </Section>
    </div>
  );

  const rulesContent = (
    <Section title="Dietary Rules" icon={ShieldCheck}>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-400">All Dietary Rules</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="text" placeholder="e.g. No shellfish, low sodium..." className="flex-1 rounded-2xl bg-stone-50 p-4 text-sm font-semibold outline-none ring-1 ring-transparent focus:ring-indigo-500" value={newRuleInput} onChange={(e) => setNewRuleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCustomRule()} />
            <button onClick={saveCustomRule} className="rounded-2xl bg-indigo-950 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white">{editingRuleId !== null ? 'Save' : 'Add'}</button>
            {editingRuleId !== null && <button onClick={cancelEditingRule} className="rounded-2xl border border-stone-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Cancel</button>}
          </div>
        </div>
        {dietaryRules.length > 0 && (
          <div className="grid gap-3">
            {dietaryRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-indigo-100 bg-indigo-50 px-4 py-4">
                <span className="text-sm font-bold text-indigo-950">{rule.text}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEditingRule(rule)} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-700 shadow-sm">Edit</button>
                  <button onClick={() => removeCustomRule(rule.id)} className="text-indigo-400 hover:text-indigo-700"><XCircle size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] pb-20 text-stone-900">
      <header className="relative overflow-hidden bg-indigo-950 px-4 py-10 text-white shadow-2xl">
        <div className="absolute right-4 top-4 z-20 rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur-sm">
          <button onClick={() => setLayoutMode('mobile')} className={`inline-flex items-center rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isMobileLayout ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/60'}`}><Smartphone size={14} className="mr-2" />Portrait</button>
          <button onClick={() => setLayoutMode('desktop')} className={`inline-flex items-center rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${!isMobileLayout ? 'bg-white text-indigo-950 shadow-sm' : 'text-white/60'}`}><Monitor size={14} className="mr-2" />Desktop</button>
        </div>
        <div className={`relative z-10 mx-auto ${isMobileLayout ? 'max-w-md' : 'max-w-6xl'}`}>
          <div className={`flex ${isMobileLayout ? 'flex-col items-start gap-6 pt-10' : 'items-center justify-between pt-8'}`}>
            <div className="flex items-center gap-5">
              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4"><ChefHat className="text-orange-400" size={40} /></div>
              <div><h1 className="text-4xl font-black italic tracking-tighter">Culina<span className="text-orange-400">Fusion</span></h1><p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Tailored Gastronomy Engine</p></div>
            </div>
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm"><div className="mr-4 flex items-center gap-2 border-r border-white/10 pr-4"><Users size={16} className="text-indigo-300" /><span className="text-xs font-black">{dinerCount} Diners</span></div><div className="flex items-center gap-2"><Baby size={16} className={isToddlerFriendly ? 'text-orange-400' : 'text-white/20'} /><span className={`text-[10px] font-black uppercase ${isToddlerFriendly ? 'text-orange-400' : 'text-white/40'}`}>Toddler {isToddlerFriendly ? 'On' : 'Off'}</span></div></div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 ${isMobileLayout ? 'max-w-md -mt-6' : 'max-w-6xl -mt-10'}`}>
        {isMobileLayout ? (
          <div className="rounded-[2.5rem] border border-stone-100 bg-white p-3 shadow-2xl shadow-stone-200">
            <div className="mb-4 flex rounded-[1.75rem] bg-stone-50 p-2">
              <button onClick={() => setActiveTab('menu')} className={`flex-1 rounded-[1.25rem] px-4 py-4 text-xs font-black uppercase tracking-widest ${activeTab === 'menu' ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400'}`}>Pantry</button>
              <button onClick={() => setActiveTab('rules')} className={`flex-1 rounded-[1.25rem] px-4 py-4 text-xs font-black uppercase tracking-widest ${activeTab === 'rules' ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-400'}`}>Rules</button>
            </div>
            {activeTab === 'menu' ? menuContent : rulesContent}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[2.75rem] border border-stone-100 bg-white p-6 shadow-2xl shadow-stone-200">{menuContent}</div>
            <div className="rounded-[2.75rem] border border-stone-100 bg-white p-6 shadow-2xl shadow-stone-200">{rulesContent}</div>
          </div>
        )}

        <button onClick={() => generateRecipes(false)} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-4 rounded-[2rem] bg-indigo-950 py-5 font-black text-white shadow-2xl disabled:bg-stone-300">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="text-orange-400" size={24} />}
          <span className="text-sm uppercase tracking-[0.25em]">{loading ? 'Simulating...' : 'Construct Menu'}</span>
        </button>
        {error && <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        {recipes.length > 0 && (
          <section className="pb-20 pt-10">
            <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Results</p><h2 className="mt-2 text-3xl font-black tracking-tighter text-indigo-950">Executive Menu</h2></div><div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400">{isMobileLayout ? 'Portrait Layout' : 'Desktop Layout'}</div></div>
            <div className="space-y-8">
              {recipes.map((recipe, index) => (
                <article key={index} className={`overflow-hidden border border-stone-100 bg-white shadow-xl ${isMobileLayout ? 'rounded-[2.5rem]' : 'rounded-[3rem]'}`}>
                  <div className={isMobileLayout ? 'border-b border-stone-100 bg-stone-50 px-6 py-6' : 'flex flex-col lg:flex-row'}>
                    <div className={isMobileLayout ? '' : 'border-b border-stone-100 bg-stone-50/70 p-10 lg:w-[30%] lg:border-b-0 lg:border-r'}>
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-indigo-500">{recipe.styleTag}</span>
                      <h3 className={`${isMobileLayout ? 'text-2xl' : 'text-3xl'} font-black leading-tight text-stone-900`}>{recipe.name}</h3>
                      {recipe.chineseName && <p className={`${isMobileLayout ? 'text-base' : 'text-lg'} mt-2 italic text-indigo-800/40`}>{recipe.chineseName}</p>}
                      <p className="mt-4 text-sm font-medium leading-relaxed text-stone-500">{recipe.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <div className="flex items-center rounded-full border border-stone-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400"><Clock size={12} className="mr-2" />{recipe.prepTime}</div>
                        <div className="flex items-center rounded-full border border-stone-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400"><Flame size={12} className="mr-2" />{recipe.cookTime}</div>
                      </div>
                    </div>
                    <div className={isMobileLayout ? 'space-y-8 px-6 py-6' : 'p-10 lg:w-[70%]'}>
                      <div className={`grid gap-8 ${isMobileLayout ? 'grid-cols-1' : 'lg:grid-cols-2 lg:gap-10'}`}>
                        <div><h4 className="mb-4 border-b pb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Ingredients</h4><ul className="space-y-2 text-sm font-bold text-stone-700">{recipe.ingredients.map((ingredient, itemIndex) => <li key={itemIndex} className="flex items-start"><span className="mr-2 text-indigo-400">/</span>{ingredient}</li>)}</ul></div>
                        <div><h4 className="mb-4 border-b pb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Execution</h4><ol className="space-y-3 text-sm">{recipe.instructions.map((step, stepIndex) => <li key={stepIndex} className="flex gap-3"><span className="pt-0.5 text-xs font-black text-indigo-950">{stepIndex + 1}.</span><span className="font-medium leading-relaxed text-stone-500">{step}</span></li>)}</ol></div>
                      </div>
                    </div>
                  </div>
                  {recipe.toddlerAdaptation && <div className={`${isMobileLayout ? 'px-6 py-5' : 'flex items-start gap-4 p-8'} border-t border-orange-100 bg-orange-50/60`}><div className={`${isMobileLayout ? 'mb-2 flex items-center gap-2' : 'rounded-2xl bg-orange-400 p-3 text-white'} text-[10px] font-black uppercase tracking-widest text-orange-900`}>{isMobileLayout ? <><Baby size={14} />Toddler Adaptation</> : <Baby size={22} />}</div><div><h5 className={`${isMobileLayout ? 'sr-only' : 'mb-1'} text-[10px] font-black uppercase tracking-widest text-orange-900`}>{isMobileLayout ? 'Toddler Adaptation' : 'Toddler Adaptation Advice'}</h5><p className="text-sm font-medium leading-relaxed text-orange-800">{recipe.toddlerAdaptation}</p></div></div>}
                </article>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-[3rem] bg-indigo-950 p-8 text-white shadow-2xl">
              <div className="mb-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-orange-400"><Undo2 size={16} /><span>Surgical Tweak</span></div>
              <h3 className="text-2xl font-black">Refine specific dishes?</h3>
              <div className={`mt-5 flex gap-4 ${isMobileLayout ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                <textarea className="min-h-[112px] flex-1 rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm outline-none placeholder:text-white/20 focus:ring-2 focus:ring-orange-400" placeholder="e.g. Swap salmon for sea bass..." value={followUpComment} onChange={(e) => setFollowUpComment(e.target.value)} />
                <button onClick={() => generateRecipes(true)} disabled={loading || !followUpComment.trim()} className="flex items-center justify-center gap-3 rounded-[1.75rem] bg-orange-400 px-10 py-5 text-xs font-black uppercase tracking-widest text-indigo-950 disabled:opacity-20"><RefreshCcw size={18} />Update</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
