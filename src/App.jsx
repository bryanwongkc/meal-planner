import React, { useEffect, useState } from 'react';
import {
  Baby, ChefHat, Clock, Flame, LayoutGrid, Loader2, Monitor,
  Plus, RefreshCcw, Settings2, ShieldCheck, Smartphone, Sparkles, Star,
  Trash2, Undo2, Users, XCircle
} from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

const PROTEIN_OPTIONS = ['Pork (Pork Belly, Sliced Pork)', 'Chicken (Thighs, Breast, Wings)', 'Beef (Flank, Sirloin, Short Ribs)', 'Tofu (Firm, Soft, Silken)', 'Fish (Whole, Fillets)', 'Shrimp / Prawns', 'Duck', 'Eggs', 'Scallops', 'Lamb', 'CUSTOM_VAL'];
const FIBER_OPTIONS = ['Bok Choy', 'Gai Lan (Chinese Broccoli)', 'Cabbage (Napa or Green)', 'Eggplant', 'Mushrooms (Shiitake, Enoki, Oyster)', 'Green Beans', 'Snow Peas', 'Bell Peppers', 'Lotus Root', 'Potato', 'Cucumber', 'CUSTOM_VAL'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const SAVED_FILTERS = ['All', ...MEAL_TYPES];
const LOCATIONS = [{ value: 'supermarket', label: 'Supermarket' }, { value: 'wet market', label: 'Wet Market' }];
const DIFFICULTIES = [{ value: 'Very Easy', label: 'Very Easy (Fusion/Western only)' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }];

const card = 'rounded-2xl border border-[#EEEEEE] bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.04)]';
const inputClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)] placeholder:text-[#6B7280]';
const selectClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)]';
const primaryButtonClass = 'rounded-xl bg-[#4B5563] px-5 py-3 text-[13px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]';
const secondaryButtonClass = 'rounded-xl border border-[rgba(107,114,128,0.22)] bg-[rgba(107,114,128,0.08)] px-4 py-2.5 text-[12px] font-semibold text-[#4B5563] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.12)] active:scale-[0.98]';

function Section({ title, icon: Icon, children }) {
  return (
    <section className={card}>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[rgba(107,114,128,0.08)] p-2.5 text-[#4B5563]"><Icon size={16} /></div>
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111111]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function IngredientBlock({ title, items, options, type, dot, addIngredient, removeIngredient, updateIngredient }) {
  return (
    <Section title={title} icon={Plus}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span>{items.length} selected</span>
        </div>
        <button onClick={() => addIngredient(type)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4B5563] text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98]" disabled={items.length >= 4}><Plus size={14} /></button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${type}-${index}`} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <select className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#111111] outline-none" value={item.value} onChange={(e) => updateIngredient(type, index, 'value', e.target.value)}>
                {options.map((option) => <option key={option} value={option}>{option === 'CUSTOM_VAL' ? 'Custom...' : option}</option>)}
              </select>
              {items.length > 1 && <button onClick={() => removeIngredient(type, index)} className="rounded-lg p-1.5 text-[#6B7280] transition hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"><Trash2 size={15} /></button>}
            </div>
            {item.value === 'CUSTOM_VAL' && <input type="text" placeholder={type === 'protein' ? 'Protein name...' : 'Veggie name...'} className={`${inputClass} mt-3`} value={item.customText} onChange={(e) => updateIngredient(type, index, 'customText', e.target.value)} />}
          </div>
        ))}
      </div>
    </Section>
  );
}

const saveRecipe = async (recipe) => {
  try {
    await addDoc(
      collection(db, 'recipes'),
      {
        ...recipe,
        createdAt: serverTimestamp()
      }
    );
    console.log('Recipe saved!');
  } catch (e) {
    console.error('Error saving recipe:', e);
  }
};

const toggleFavoriteRecipe = async (recipeId, isFavorite) => {
  try {
    await updateDoc(doc(db, 'recipes', recipeId), {
      isFavorite: !isFavorite
    });
  } catch (e) {
    console.error('Error updating favorite recipe:', e);
  }
};

const deleteSavedRecipe = async (recipeId) => {
  try {
    await deleteDoc(doc(db, 'recipes', recipeId));
  } catch (e) {
    console.error('Error deleting recipe:', e);
  }
};

const buildSavedRecipePayload = (recipe, mealType) => ({
  title: recipe.chineseName ? `${recipe.chineseName} + ${recipe.name}` : recipe.name,
  mealType: mealType.toLowerCase(),
  isFavorite: false,
  ...recipe
});

const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'recipes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(data);
    });

    return () => unsubscribe();
  }, []);

  return recipes;
};

export default function App() {
  const [layoutMode, setLayoutMode] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [activeTab, setActiveTab] = useState('menu');
  const [mainTab, setMainTab] = useState('planner');
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
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followUpComment, setFollowUpComment] = useState('');
  const recipes = useRecipes();
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState(null);
  const [savedMealFilter, setSavedMealFilter] = useState('All');
  const [savedSearch, setSavedSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const isMobileLayout = layoutMode === 'mobile';
  const trackClass = 'w-full cursor-pointer accent-[#4B5563]';
  const filteredSavedRecipes = recipes.filter((recipe) => {
    const matchesMealType = savedMealFilter === 'All' || recipe.mealType?.toLowerCase() === savedMealFilter.toLowerCase();
    const matchesSearch = !savedSearch.trim()
      || recipe.title?.toLowerCase().includes(savedSearch.trim().toLowerCase())
      || recipe.name?.toLowerCase().includes(savedSearch.trim().toLowerCase())
      || recipe.chineseName?.toLowerCase().includes(savedSearch.trim().toLowerCase());
    const matchesFavorite = !showFavoritesOnly || recipe.isFavorite;
    return matchesMealType && matchesSearch && matchesFavorite;
  });

  useEffect(() => {
    if (!selectedSavedRecipe?.id) return;
    const latestRecipe = recipes.find((recipe) => recipe.id === selectedSavedRecipe.id);
    if (latestRecipe) {
      setSelectedSavedRecipe(latestRecipe);
    } else {
      setSelectedSavedRecipe(null);
    }
  }, [recipes, selectedSavedRecipe]);

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
    const model = 'gemini-3.1-flash-lite-preview';
    if (!apiKey) {
      setError('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      setLoading(false);
      return;
    }
    const activeRules = dietaryRules.map((rule) => rule.text);
    const finalProteins = proteins.map((p) => (p.value === 'CUSTOM_VAL' ? p.customText : p.value)).filter(Boolean);
    const finalFibers = fibers.map((f) => (f.value === 'CUSTOM_VAL' ? f.customText : f.value)).filter(Boolean);
    const toddlerInstruction = isToddlerFriendly
      ? "Include a 'toddlerAdaptation' string for each dish."
      : "Do not include toddlerAdaptation.";
    const cookingTipsInstruction = 'Include 3 to 5 short, practical, actionable cookingTips for each dish.';
    const preferenceInstruction = todayPreference.trim() ? `TODAY PREFERENCE: ${todayPreference.trim()}.` : '';
    const flavorHealthInstruction = `FLAVOR VS HEALTH: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)}). Reflect this balance in ingredient choices, cooking method, seasoning intensity, richness, and oil or sauce usage.`;
    const prompt = isRefinement
      ? `Refine the following menu: ${JSON.stringify(generatedRecipes)} FEEDBACK: "${followUpComment}" DINERS: ${dinerCount} TASK: Modify ONLY specific dishes. Keep others exactly the same. MEAL TYPE: ${mealType}. ${preferenceInstruction} ${flavorHealthInstruction} DIETARY: ${activeRules.join(', ')}. TODDLER MODE: ${isToddlerFriendly ? 'ON - update toddlerAdaptation if relevant.' : 'OFF'} STYLE: ${getStyleLabel(styleWeight)}. DIFFICULTY: ${difficulty}. ${cookingTipsInstruction}`
      : `Executive Chef Role. Create ${dishCount} recipes for ${dinerCount} diners. MEAL TYPE: ${mealType}. ${preferenceInstruction} ${flavorHealthInstruction} STYLE: ${getStyleLabel(styleWeight)} DIFFICULTY: ${difficulty} INGREDIENTS: Proteins (${finalProteins.join(', ')}); Fibers (${finalFibers.join(', ')}) RULES: ${activeRules.join(', ')} SHOPPING: ${location} ${toddlerInstruction} ${cookingTipsInstruction}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, chineseName: { type: 'STRING' }, styleTag: { type: 'STRING' }, description: { type: 'STRING' }, prepTime: { type: 'STRING' }, cookTime: { type: 'STRING' }, ingredients: { type: 'ARRAY', items: { type: 'STRING' } }, instructions: { type: 'ARRAY', items: { type: 'STRING' } }, cookingTips: { type: 'ARRAY', items: { type: 'STRING' } }, toddlerAdaptation: { type: 'STRING' } }, required: ['name', 'styleTag', 'description', 'prepTime', 'cookTime', 'ingredients', 'instructions', 'cookingTips'] } } } };
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
      const { response, data } = await requestRecipes(model);
      if (!response.ok) throw new Error(`API call failed with status ${response.status}`);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        const parsedRecipes = JSON.parse(resultText).map((recipe) => (
          isToddlerFriendly ? recipe : { ...recipe, toddlerAdaptation: '' }
        ));
        setGeneratedRecipes(parsedRecipes);
        if (isRefinement) setFollowUpComment('');
      } else {
        throw new Error('API returned no recipe payload');
      }
    } catch {
      setError('Gemini request failed. Check VITE_GEMINI_API_KEY and deployment logs.');
    } finally {
      setLoading(false);
    }
  };

  const menuContent = (
    <div className="space-y-5">
      <Section title="Meal Profile" icon={LayoutGrid}>
        <div className={`grid gap-5 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[12px] font-medium text-[#6B7280]">Dishes</label><span className="text-[22px] font-semibold text-[#111111]">{dishCount}</span></div><input type="range" min="1" max="6" step="1" value={dishCount} onChange={(e) => setDishCount(parseInt(e.target.value, 10))} className={trackClass} /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Light spread</span><span>Full table</span></div></div>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[12px] font-medium text-[#6B7280]">Diners</label><span className="text-[22px] font-semibold text-[#111111]">{dinerCount}</span></div><input type="range" min="2" max="8" step="1" value={dinerCount} onChange={(e) => setDinerCount(parseInt(e.target.value, 10))} className={trackClass} /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Smaller meal</span><span>Group dinner</span></div></div>
          <div className="space-y-3"><div className="flex items-center justify-between gap-4"><label className="text-[12px] font-medium text-[#6B7280]">Flavor Weight</label><span className="text-[13px] font-medium text-[#4B5563]">{getStyleLabel(styleWeight)}</span></div><input type="range" min="-100" max="100" step="20" value={styleWeight} onChange={(e) => setStyleWeight(parseInt(e.target.value, 10))} className="w-full cursor-pointer accent-[#4B5563]" /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Classic</span><span>Global</span><span>Bold</span></div></div>
        </div>
      </Section>
      <div className={`grid gap-5 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <IngredientBlock title="Proteins" items={proteins} options={PROTEIN_OPTIONS} type="protein" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} />
        <IngredientBlock title="Veggies" items={fibers} options={FIBER_OPTIONS} type="fiber" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} />
      </div>
      <Section title="Kitchen Settings" icon={Settings2}>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[#6B7280]">Meal Type</label>
            <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition duration-200 ease-out ${
                    mealType === type ? 'bg-[#4B5563] text-white shadow-[0_4px_12px_rgba(75,85,99,0.18)]' : 'text-[#6B7280]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[#6B7280]">Today Preference</label>
            <div>
              <input
                type="text"
                placeholder="e.g. soupy, light, comforting, crispy..."
                className={inputClass}
                value={todayPreference}
                onChange={(e) => setTodayPreference(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-[12px] font-medium text-[#6B7280]">Flavor vs Health</label>
              <span className="text-[13px] font-medium text-[#4B5563]">{getFlavorHealthLabel(flavorHealthBalance)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={flavorHealthBalance}
              onChange={(e) => setFlavorHealthBalance(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-[#4B5563]"
            />
            <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
              <span>Healthier / lighter</span>
              <span>{flavorHealthBalance}</span>
              <span>Richer / flavorful</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-[15px] font-medium text-[#111111]">Service Mode</p><p className="text-[13px] text-[#6B7280]">Switch toddler-safe guidance on or off.</p></div>
            <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1">
              <button onClick={() => setIsToddlerFriendly(false)} className={`rounded-lg px-4 py-2.5 text-[13px] font-medium transition duration-200 ease-out ${!isToddlerFriendly ? 'bg-[#4B5563] text-white shadow-[0_4px_12px_rgba(75,85,99,0.18)]' : 'text-[#6B7280]'}`}>Adults Only</button>
              <button onClick={() => setIsToddlerFriendly(true)} className={`flex items-center rounded-lg px-4 py-2.5 text-[13px] font-medium transition duration-200 ease-out ${isToddlerFriendly ? 'bg-[#4B5563] text-white shadow-[0_4px_12px_rgba(75,85,99,0.18)]' : 'text-[#6B7280]'}`}><Baby size={12} className="mr-1.5" />Toddler</button>
            </div>
          </div>
          <div className={`grid gap-4 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2"><label className="text-[12px] font-medium text-[#6B7280]">Technique Level</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>{DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[12px] font-medium text-[#6B7280]">Supply Source</label><select value={location} onChange={(e) => setLocation(e.target.value)} className={selectClass}>{LOCATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          </div>
        </div>
      </Section>
    </div>
  );

  const rulesContent = (
    <Section title="Dietary Rules" icon={ShieldCheck}>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-[12px] font-medium text-[#6B7280]">All Dietary Rules</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="text" placeholder="e.g. No shellfish, low sodium..." className={`flex-1 ${inputClass}`} value={newRuleInput} onChange={(e) => setNewRuleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCustomRule()} />
            <button onClick={saveCustomRule} className={primaryButtonClass}>{editingRuleId !== null ? 'Save' : 'Add'}</button>
            {editingRuleId !== null && <button onClick={cancelEditingRule} className={secondaryButtonClass}>Cancel</button>}
          </div>
        </div>
        {dietaryRules.length > 0 && (
          <div className="grid gap-3">
            {dietaryRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[rgba(107,114,128,0.08)] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#6B7280]" />
                  <span className="text-[15px] font-medium text-[#111111]">{rule.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEditingRule(rule)} className={secondaryButtonClass}>Edit</button>
                  <button onClick={() => removeCustomRule(rule.id)} className="rounded-lg p-1.5 text-[#6B7280] transition hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"><XCircle size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );

  const savedRecipesContent = (
    <section className="space-y-5 pb-20 pt-2">
      <Section title="Saved Recipes" icon={Star}>
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="text-[12px] font-medium text-[#6B7280]">Search</label>
            <input
              type="text"
              placeholder="Search title or dish name..."
              className={inputClass}
              value={savedSearch}
              onChange={(e) => setSavedSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-medium text-[#6B7280]">Meal Type</label>
            <div className="flex flex-wrap gap-2">
              {SAVED_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSavedMealFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-medium transition duration-200 ease-out ${
                    savedMealFilter === filter
                      ? 'border-[#4B5563] bg-[#4B5563] text-white'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium text-[#111111]">Favorites only</p>
              <p className="text-[12px] text-[#6B7280]">Show starred recipes only.</p>
            </div>
            <button
              onClick={() => setShowFavoritesOnly((value) => !value)}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition duration-200 ease-out ${
                showFavoritesOnly
                  ? 'border-[#4B5563] bg-[#4B5563] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280]'
              }`}
            >
              {showFavoritesOnly ? 'On' : 'Off'}
            </button>
          </div>

          <div className="grid gap-4">
            {filteredSavedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#EEEEEE] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
                <button
                  onClick={() => setSelectedSavedRecipe(recipe)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h3 className="truncate text-[17px] font-semibold text-[#111111]">{recipe.title}</h3>
                  <p className="mt-1 text-[14px] capitalize text-[#6B7280]">{recipe.mealType}</p>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavoriteRecipe(recipe.id, recipe.isFavorite)}
                    className={`rounded-lg p-2 transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.08)] ${
                      recipe.isFavorite ? 'text-[#4B5563]' : 'text-[#9CA3AF]'
                    }`}
                    aria-label={recipe.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
                  >
                    <Star size={18} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => deleteSavedRecipe(recipe.id)}
                    className="rounded-lg p-2 text-[#9CA3AF] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"
                    aria-label="Delete saved recipe"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filteredSavedRecipes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-5 py-8 text-center text-[14px] text-[#6B7280]">
                No saved recipes match the current filters.
              </div>
            )}
          </div>
        </div>
      </Section>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-20 text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.6)] px-4 py-4 backdrop-blur-[12px]">
        <div className="mx-auto max-w-6xl">
          <div className={`flex ${isMobileLayout ? 'flex-col gap-4' : 'items-center justify-between gap-6'}`}>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 text-[#111111] shadow-[0_6px_20px_rgba(0,0,0,0.04)]"><ChefHat size={28} /></div>
              <div><h1 className="text-[30px] font-bold tracking-[-0.03em] text-[#111111]">Culina<span className="text-[#4B5563]">Fusion</span></h1><p className="mt-1 text-[12px] text-[#6B7280]">Tailored gastronomy engine</p></div>
            </div>
            <div className={`flex ${isMobileLayout ? 'flex-wrap' : 'items-center'} gap-3`}>
              <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1">
                <button onClick={() => setLayoutMode('mobile')} className={`inline-flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition ${isMobileLayout ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}><Smartphone size={14} className="mr-2" />Portrait</button>
                <button onClick={() => setLayoutMode('desktop')} className={`inline-flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition ${!isMobileLayout ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}><Monitor size={14} className="mr-2" />Desktop</button>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#111111] shadow-[0_6px_20px_rgba(0,0,0,0.04)]"><Users size={14} className="text-[#4B5563]" /><span>{dinerCount} Diners</span></div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium shadow-[0_6px_20px_rgba(0,0,0,0.04)] ${isToddlerFriendly ? 'border-[rgba(107,114,128,0.22)] bg-[rgba(107,114,128,0.08)] text-[#4B5563]' : 'border-[#E5E7EB] bg-white text-[#6B7280]'}`}><Baby size={14} className={isToddlerFriendly ? 'text-[#4B5563]' : 'text-[#6B7280]'} /><span>{isToddlerFriendly ? 'Toddler On' : 'Adults Only'}</span></div>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 pt-8 ${isMobileLayout ? 'max-w-md' : 'max-w-6xl'}`}>
        <div className="mb-6 flex rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1">
          <button onClick={() => setMainTab('planner')} className={`flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition ${mainTab === 'planner' ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}>Planner</button>
          <button onClick={() => setMainTab('saved')} className={`flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition ${mainTab === 'saved' ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}>Saved</button>
        </div>

        {mainTab === 'planner' ? (
          <>
            {isMobileLayout ? (
              <div className="space-y-6">
                <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1">
                  <button onClick={() => setActiveTab('menu')} className={`flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition ${activeTab === 'menu' ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}>Pantry</button>
                  <button onClick={() => setActiveTab('rules')} className={`flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition ${activeTab === 'rules' ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`}>Rules</button>
                </div>
                {activeTab === 'menu' ? menuContent : rulesContent}
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-6">{menuContent}</div>
                <div>{rulesContent}</div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button onClick={() => generateRecipes(false)} disabled={loading} className="flex w-full max-w-6xl items-center justify-center gap-3 rounded-xl bg-[#4B5563] px-6 py-4 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(75,85,99,0.18)] transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>{loading ? 'Generating menu...' : 'Construct Menu'}</span>
              </button>
            </div>
            {error && <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-medium text-[#6B7280] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">{error}</div>}

            {generatedRecipes.length > 0 && (
              <section className="pb-20 pt-10">
                <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-[12px] text-[#6B7280]">Results</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#111111]">Executive Menu</h2></div><div className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[12px] font-medium text-[#6B7280] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">{isMobileLayout ? 'Portrait Layout' : 'Desktop Layout'}</div></div>
                <div className="space-y-8">
                  {generatedRecipes.map((recipe, index) => (
                    <article key={index} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
                      <div className={isMobileLayout ? 'border-b border-[#EEEEEE] px-6 py-6' : 'flex flex-col lg:flex-row'}>
                        <div className={isMobileLayout ? '' : 'border-b border-[#EEEEEE] p-8 lg:w-[30%] lg:border-b-0 lg:border-r'}>
                          <span className="mb-3 block text-[12px] font-medium text-[#4B5563]">{recipe.styleTag}</span>
                          <h3 className={`${isMobileLayout ? 'text-[24px]' : 'text-[30px]'} font-semibold leading-tight text-[#111111]`}>{recipe.name}</h3>
                          {recipe.chineseName && <p className={`${isMobileLayout ? 'text-[15px]' : 'text-[16px]'} mt-2 text-[#6B7280]`}>{recipe.chineseName}</p>}
                          <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">{recipe.description}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Clock size={12} className="mr-2 text-[#4B5563]" />{recipe.prepTime}</div>
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Flame size={12} className="mr-2 text-[#4B5563]" />{recipe.cookTime}</div>
                          </div>
                          <button
                            onClick={() => saveRecipe(buildSavedRecipePayload(recipe, mealType))}
                            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#4B5563] px-4 py-2.5 text-[13px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98]"
                          >
                            Save Recipe
                          </button>
                        </div>
                        <div className={isMobileLayout ? 'space-y-8 px-6 py-6' : 'p-8 lg:w-[70%]'}>
                          <div className={`grid gap-8 ${isMobileLayout ? 'grid-cols-1' : 'lg:grid-cols-3 lg:gap-8'}`}>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Ingredients</h4><ul className="space-y-3 text-[15px] text-[#111111]">{recipe.ingredients.map((ingredient, itemIndex) => <li key={itemIndex} className="flex items-start"><span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6B7280]" />{ingredient}</li>)}</ul></div>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Execution</h4><ol className="space-y-4 text-[15px]">{recipe.instructions.map((step, stepIndex) => <li key={stepIndex} className="flex gap-3"><span className="pt-0.5 text-[13px] font-semibold text-[#4B5563]">{stepIndex + 1}.</span><span className="leading-relaxed text-[#6B7280]">{step}</span></li>)}</ol></div>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Cooking Tips</h4><ul className="space-y-3 text-[15px]">{recipe.cookingTips?.map((tip, tipIndex) => <li key={tipIndex} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 leading-relaxed text-[#6B7280]">{tip}</li>)}</ul></div>
                          </div>
                        </div>
                      </div>
                      {isToddlerFriendly && recipe.toddlerAdaptation && <div className={`${isMobileLayout ? 'px-6 py-5' : 'flex items-start gap-4 p-8'} border-t border-[#E5E7EB] bg-[rgba(107,114,128,0.08)]`}><div className={`${isMobileLayout ? 'mb-2 flex items-center gap-2' : 'rounded-xl bg-[#4B5563] p-3 text-white'} text-[12px] font-medium text-[#4B5563]`}>{isMobileLayout ? <><Baby size={14} />Toddler Adaptation</> : <Baby size={20} />}</div><div><h5 className={`${isMobileLayout ? 'sr-only' : 'mb-1'} text-[12px] font-medium text-[#4B5563]`}>{isMobileLayout ? 'Toddler Adaptation' : 'Toddler Adaptation Advice'}</h5><p className="text-[15px] leading-relaxed text-[#6B7280]">{recipe.toddlerAdaptation}</p></div></div>}
                    </article>
                  ))}
                </div>

                <div className="mt-10 overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white p-8 shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
                  <div className="mb-3 flex items-center gap-3 text-[12px] font-medium text-[#4B5563]"><Undo2 size={16} /><span>Surgical Tweak</span></div>
                  <h3 className="text-[22px] font-semibold text-[#111111]">Refine specific dishes?</h3>
                  <div className={`mt-5 flex gap-4 ${isMobileLayout ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                    <textarea className="min-h-[112px] flex-1 rounded-xl border border-[#E5E7EB] bg-white p-5 text-[15px] text-[#111111] outline-none placeholder:text-[#6B7280] focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)]" placeholder="e.g. Swap salmon for sea bass..." value={followUpComment} onChange={(e) => setFollowUpComment(e.target.value)} />
                    <button onClick={() => generateRecipes(true)} disabled={loading || !followUpComment.trim()} className="flex items-center justify-center gap-3 rounded-xl bg-[#4B5563] px-10 py-4 text-[14px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:opacity-40"><RefreshCcw size={18} />Update</button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          savedRecipesContent
        )}
      </main>

      {selectedSavedRecipe && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(17,17,17,0.45)] p-4 sm:items-center">
          <div className={`max-h-[90vh] w-full overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_20px_48px_rgba(0,0,0,0.18)] ${isMobileLayout ? 'max-w-md' : 'max-w-4xl'}`}>
            <div className="flex items-start justify-between border-b border-[#E5E7EB] px-6 py-5">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Saved Recipe</p>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#111111]">
                  {selectedSavedRecipe.title || selectedSavedRecipe.name}
                </h3>
                <p className="mt-1 text-[14px] capitalize text-[#6B7280]">{selectedSavedRecipe.mealType}</p>
              </div>
              <button
                onClick={() => setSelectedSavedRecipe(null)}
                className="rounded-lg p-2 text-[#6B7280] transition hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  {selectedSavedRecipe.styleTag && (
                    <span className="mb-3 block text-[12px] font-medium text-[#4B5563]">{selectedSavedRecipe.styleTag}</span>
                  )}
                  {selectedSavedRecipe.chineseName && (
                    <p className="mb-3 text-[15px] text-[#6B7280]">{selectedSavedRecipe.chineseName}</p>
                  )}
                  {selectedSavedRecipe.description && (
                    <p className="text-[15px] leading-relaxed text-[#6B7280]">{selectedSavedRecipe.description}</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedSavedRecipe.prepTime && (
                      <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                        <Clock size={12} className="mr-2 text-[#4B5563]" />
                        {selectedSavedRecipe.prepTime}
                      </div>
                    )}
                    {selectedSavedRecipe.cookTime && (
                      <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                        <Flame size={12} className="mr-2 text-[#4B5563]" />
                        {selectedSavedRecipe.cookTime}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-[13px] font-medium text-[#6B7280]">Ingredients</h4>
                    {selectedSavedRecipe.ingredients?.length ? (
                      <ul className="space-y-3 text-[15px] text-[#111111]">
                        {selectedSavedRecipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6B7280]" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[14px] text-[#6B7280]">No ingredients saved.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-3 text-[13px] font-medium text-[#6B7280]">Execution</h4>
                    {selectedSavedRecipe.instructions?.length ? (
                      <ol className="space-y-4 text-[15px]">
                        {selectedSavedRecipe.instructions.map((step, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="pt-0.5 text-[13px] font-semibold text-[#4B5563]">{index + 1}.</span>
                            <span className="leading-relaxed text-[#6B7280]">{step}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-[14px] text-[#6B7280]">No instructions saved.</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedSavedRecipe.cookingTips?.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-[13px] font-medium text-[#6B7280]">Cooking Tips</h4>
                  <div className="grid gap-3">
                    {selectedSavedRecipe.cookingTips.map((tip, index) => (
                      <div key={index} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-[15px] leading-relaxed text-[#6B7280]">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSavedRecipe.toddlerAdaptation && (
                <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[rgba(107,114,128,0.08)] px-5 py-4">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#4B5563]">
                    <Baby size={14} />
                    <span>Toddler Adaptation</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#6B7280]">{selectedSavedRecipe.toddlerAdaptation}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => deleteSavedRecipe(selectedSavedRecipe.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.08)]"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => toggleFavoriteRecipe(selectedSavedRecipe.id, selectedSavedRecipe.isFavorite)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition duration-200 ease-out ${
                    selectedSavedRecipe.isFavorite
                      ? 'border-[#4B5563] bg-[rgba(107,114,128,0.08)] text-[#4B5563]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                  }`}
                >
                  <Star size={16} fill={selectedSavedRecipe.isFavorite ? 'currentColor' : 'none'} />
                  <span>{selectedSavedRecipe.isFavorite ? 'Favorited' : 'Mark Favorite'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
