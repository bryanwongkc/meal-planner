import React, { useEffect, useRef, useState } from 'react';
import {
  Baby, ChefHat, Clock, Flame, LayoutGrid, Loader2, Menu, Monitor,
  Plus, RefreshCcw, Settings2, ShieldCheck, Smartphone, Sparkles, Star,
  Trash2, Undo2, Users, XCircle
} from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

const PROTEIN_OPTIONS = ['Pork (Pork Belly, Sliced Pork)', 'Chicken (Thighs, Breast, Wings)', 'Beef (Flank, Sirloin, Short Ribs)', 'Tofu (Firm, Soft, Silken)', 'Fish (Whole, Fillets)', 'Shrimp / Prawns', 'Duck', 'Eggs', 'Scallops', 'Lamb', 'CUSTOM_VAL'];
const FIBER_OPTIONS = ['Bok Choy', 'Gai Lan (Chinese Broccoli)', 'Cabbage (Napa or Green)', 'Eggplant', 'Mushrooms (Shiitake, Enoki, Oyster)', 'Green Beans', 'Snow Peas', 'Bell Peppers', 'Lotus Root', 'Potato', 'Cucumber', 'CUSTOM_VAL'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const SAVED_FILTERS = ['All', ...MEAL_TYPES];
const LOCATIONS = [{ value: 'supermarket', label: 'Supermarket' }, { value: 'wet market', label: 'Wet Market' }];
const DIFFICULTIES = [{ value: 'Very Easy', label: 'Very Easy (Fusion/Western only)' }, { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }];
const DEFAULT_DIETARY_RULES = [
  { id: 'no-spicy', text: 'No Spicy Food', order: 0 },
  { id: 'one-veg', text: '1x Strictly Vegetarian', order: 1 },
  { id: 'hk-household', text: 'Authentic Chinese mode: use top 100 Hong Kong household dishes only', order: 2 }
];

const card = 'min-w-0 rounded-2xl border border-[#EEEEEE] bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.04)]';
const inputClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)] placeholder:text-[#6B7280]';
const selectClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)]';
const primaryButtonClass = 'rounded-xl bg-[#4B5563] px-5 py-3 text-[13px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]';
const secondaryButtonClass = 'rounded-xl border border-[rgba(107,114,128,0.22)] bg-[rgba(107,114,128,0.08)] px-4 py-2.5 text-[12px] font-semibold text-[#4B5563] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.12)] active:scale-[0.98]';

function Section({ title, icon: Icon, children, compact = false }) {
  return (
    <section className={compact ? 'min-w-0 rounded-xl border border-[#EEEEEE] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.035)]' : card}>
      <div className={`${compact ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
        <div className={`${compact ? 'rounded-lg p-2' : 'rounded-xl p-2.5'} bg-[rgba(107,114,128,0.08)] text-[#4B5563]`}><Icon size={compact ? 14 : 16} /></div>
        <h3 className={`${compact ? 'text-[18px]' : 'text-[20px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function IngredientBlock({ title, items, options, type, dot, addIngredient, removeIngredient, updateIngredient, compact = false }) {
  return (
    <Section title={title} icon={Plus} compact={compact}>
      <div className={`${compact ? 'mb-3' : 'mb-4'} flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span>{items.length} selected</span>
        </div>
        <button onClick={() => addIngredient(type)} className={`flex ${compact ? 'h-8 w-8' : 'h-9 w-9'} items-center justify-center rounded-full bg-[#4B5563] text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98]`} disabled={items.length >= 4}><Plus size={compact ? 13 : 14} /></button>
      </div>
      <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
        {items.map((item, index) => (
          <div key={`${type}-${index}`} className={`rounded-xl border border-[#E5E7EB] bg-white ${compact ? 'p-2.5' : 'p-3'}`}>
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

const getRecipeTitle = (recipe, mealType) => buildSavedRecipePayload(recipe, mealType).title;

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

const useDietaryRules = () => {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'dietaryRules'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await Promise.all(
          DEFAULT_DIETARY_RULES.map((rule) => setDoc(doc(db, 'dietaryRules', rule.id), {
            text: rule.text,
            order: rule.order,
            createdAt: serverTimestamp()
          }))
        );
        return;
      }

      const data = snapshot.docs.map((ruleDoc) => ({
        id: ruleDoc.id,
        ...ruleDoc.data()
      }));
      setRules(data);
    });

    return () => unsubscribe();
  }, []);

  return rules;
};

export default function App() {
  const [layoutMode, setLayoutMode] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [currentView, setCurrentView] = useState('main');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [dishCount, setDishCount] = useState(3);
  const [dinerCount, setDinerCount] = useState(3);
  const [isToddlerFriendly, setIsToddlerFriendly] = useState(false);
  const [styleWeight, setStyleWeight] = useState(-100);
  const [flavorHealthBalance, setFlavorHealthBalance] = useState(50);
  const [proteins, setProteins] = useState([{ value: PROTEIN_OPTIONS[0], customText: '' }]);
  const [fibers, setFibers] = useState([{ value: FIBER_OPTIONS[0], customText: '' }]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]);
  const [todayPreference, setTodayPreference] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].value);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followUpComment, setFollowUpComment] = useState('');
  const [lastGeminiPrompt, setLastGeminiPrompt] = useState('');
  const recipes = useRecipes();
  const dietaryRules = useDietaryRules();
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState(null);
  const [activeSavedRecipeActions, setActiveSavedRecipeActions] = useState(null);
  const [recipeQuestionTarget, setRecipeQuestionTarget] = useState(null);
  const [recipeQuestion, setRecipeQuestion] = useState('');
  const [recipeAnswer, setRecipeAnswer] = useState('');
  const [recipeQuestionLoading, setRecipeQuestionLoading] = useState(false);
  const [savedMealFilter, setSavedMealFilter] = useState('All');
  const [savedSearch, setSavedSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const longPressTimerRef = useRef(null);

  const isMobileLayout = layoutMode === 'mobile';
  const trackClass = 'w-full cursor-pointer accent-[#4B5563]';
  const sectionCardClass = isMobileLayout ? 'min-w-0 rounded-xl border border-[#EEEEEE] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.035)]' : card;
  const compactGapClass = isMobileLayout ? 'space-y-3' : 'space-y-5';
  const compactStackClass = isMobileLayout ? 'space-y-4' : 'space-y-6';
  const getSavedGeneratedRecipe = (recipe) => recipes.find((savedRecipe) => savedRecipe.title === getRecipeTitle(recipe, mealType));
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

  useEffect(() => () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startSavedRecipeLongPress = (recipe) => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      setActiveSavedRecipeActions(recipe);
      longPressTimerRef.current = null;
    }, 450);
  };

  const saveCustomRule = async () => {
    if (!newRuleInput.trim()) return;
    if (editingRuleId !== null) {
      await updateDoc(doc(db, 'dietaryRules', editingRuleId), {
        text: newRuleInput.trim()
      });
      setEditingRuleId(null);
    } else {
      await addDoc(collection(db, 'dietaryRules'), {
        text: newRuleInput.trim(),
        order: dietaryRules.length,
        createdAt: serverTimestamp()
      });
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
  const removeCustomRule = async (id) => {
    await deleteDoc(doc(db, 'dietaryRules', id));
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

  const getMealTypeInstruction = (selectedMealType) => {
    if (selectedMealType === 'Breakfast') {
      return 'MEAL TYPE RULES: Generate breakfast-appropriate dishes only. Favor lighter morning cooking, congee, eggs, toast-based items, oats, noodles, porridges, sandwiches, breakfast plates, simple soups, or gentle stir-fries. Avoid dinner-like heavy braises, banquet dishes, and large multi-course mains unless clearly breakfast-appropriate.';
    }
    if (selectedMealType === 'Lunch') {
      return 'MEAL TYPE RULES: Generate lunch-appropriate dishes only. Favor balanced, practical midday meals that are satisfying but not overly heavy. Avoid breakfast dishes and avoid dinner-only celebratory or long-braise dishes unless they still feel realistic for lunch.';
    }
    return 'MEAL TYPE RULES: Generate dinner-appropriate dishes only. Favor fuller savory dishes, home-style mains, richer soups, braises, stir-fries, roasted dishes, or complete evening meal compositions. Avoid breakfast-specific dishes.';
  };

  const getStyleInstruction = (styleLabel) => {
    if (styleLabel === 'Authentic Chinese') {
      return 'STYLE RULES: Keep the dishes fully Chinese in flavor, technique, naming, ingredient pairing, seasoning profile, and presentation. Do not westernize the dishes or blend in fusion elements.';
    }
    if (styleLabel === 'Chinese-leaning Fusion') {
      return 'STYLE RULES: Keep the dishes clearly Chinese-led, with only light fusion influence. Chinese techniques, seasonings, and structure should dominate.';
    }
    if (styleLabel === 'Global Fusion') {
      return 'STYLE RULES: Allow balanced cross-cultural fusion. The dish may combine Chinese and non-Chinese influences in a deliberate way.';
    }
    if (styleLabel === 'Western-leaning Fusion') {
      return 'STYLE RULES: Keep the dishes primarily Western in composition while still allowing some Chinese or Asian influence. The result should still read as intentional fusion.';
    }
    return 'STYLE RULES: Generate fully Western dishes only. Do not make them fusion. Do not use Chinese naming, Chinese seasoning frameworks, wok-based Chinese technique, or Chinese dish structures unless explicitly requested elsewhere.';
  };

  const buildPromptSection = (title, lines) => {
    const filteredLines = lines.filter(Boolean);
    if (filteredLines.length === 0) return '';
    return [`${title}`, ...filteredLines].join('\n');
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
    const styleLabel = getStyleLabel(styleWeight);
    const activeRules = dietaryRules.map((rule) => rule.text);
    const finalProteins = proteins.map((p) => (p.value === 'CUSTOM_VAL' ? p.customText : p.value)).filter(Boolean);
    const finalFibers = fibers.map((f) => (f.value === 'CUSTOM_VAL' ? f.customText : f.value)).filter(Boolean);
    const toddlerInstruction = isToddlerFriendly
      ? "Include a 'toddlerAdaptation' string for each dish."
      : "Do not include toddlerAdaptation.";
    const cookingTipsInstruction = 'Include 3 to 5 short, practical, actionable cookingTips for each dish.';
    const preferenceInstruction = todayPreference.trim() ? `TODAY PREFERENCE: ${todayPreference.trim()}.` : '';
    const flavorHealthInstruction = `FLAVOR VS HEALTH: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)}). Reflect this balance in ingredient choices, cooking method, seasoning intensity, richness, and oil or sauce usage.`;
    const mealTypeInstruction = getMealTypeInstruction(mealType);
    const styleInstruction = getStyleInstruction(styleLabel);
    const hkHouseholdInstruction = styleLabel === 'Authentic Chinese'
      ? 'Because STYLE is Authentic Chinese, constrain every dish to the top 100 most common Hong Kong household dishes. Do not generate banquet dishes, restaurant-only dishes, or non-household fusion dishes.'
      : '';
    const parameterSection = buildPromptSection('PARAMETERS', [
      `DISH_COUNT: ${dishCount}`,
      `DINER_COUNT: ${dinerCount}`,
      `MEAL_TYPE: ${mealType}`,
      `TODAY_PREFERENCE: ${todayPreference.trim() || 'None'}`,
      `STYLE: ${styleLabel}`,
      `FLAVOR_HEALTH_BALANCE: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)})`,
      `TODDLER_MODE: ${isToddlerFriendly ? 'ON' : 'OFF'}`,
      `DIFFICULTY: ${difficulty}`,
      `SHOPPING_SOURCE: ${location}`,
      `PROTEINS: ${finalProteins.join(', ') || 'None'}`,
      `VEGETABLES: ${finalFibers.join(', ') || 'None'}`,
      `DIETARY_RULES: ${activeRules.join('; ') || 'None'}`
    ]);
    const instructionSection = buildPromptSection('INSTRUCTIONS', [
      mealTypeInstruction,
      styleInstruction,
      flavorHealthInstruction,
      toddlerInstruction,
      hkHouseholdInstruction,
      cookingTipsInstruction
    ]);
    const outputSection = buildPromptSection('OUTPUT REQUIREMENTS', [
      `Return exactly ${dishCount} recipe objects as JSON.`,
      'Each recipe must match the requested meal type, style, and dietary constraints.',
      'Use the provided proteins and vegetables as primary anchors where practical.',
      "Keep the response schema-compatible with the required JSON fields only."
    ]);
    const refinementSection = isRefinement
      ? buildPromptSection('REFINEMENT TASK', [
          'Modify only the specific dishes needed to address the feedback.',
          'Keep unchanged dishes as close as possible to the existing version.',
          `FEEDBACK: ${followUpComment || 'None'}`,
          `CURRENT_MENU_JSON: ${JSON.stringify(generatedRecipes)}`
        ])
      : buildPromptSection('TASK', [
          'Create a new menu from scratch.',
          'Make the dishes feel coherent as one meal set.'
        ]);
    const prompt = [
      'ROLE',
      'You are an expert meal-planning chef generating production-ready home-cooking recipes.',
      '',
      parameterSection,
      '',
      instructionSection,
      '',
      refinementSection,
      '',
      outputSection
    ].join('\n');
    setLastGeminiPrompt(prompt);
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

  const askRecipeFollowUp = async () => {
    if (!recipeQuestionTarget || !recipeQuestion.trim()) return;

    setRecipeQuestionLoading(true);
    setError('');
    setRecipeAnswer('');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = 'gemini-3.1-flash-lite-preview';
    if (!apiKey) {
      setError('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      setRecipeQuestionLoading(false);
      return;
    }

    const prompt = [
      'ROLE',
      'You are a practical cooking assistant answering a follow-up question about a specific saved recipe.',
      '',
      buildPromptSection('RECIPE CONTEXT', [
        `TITLE: ${recipeQuestionTarget.title || recipeQuestionTarget.name || 'Unknown'}`,
        `MEAL_TYPE: ${recipeQuestionTarget.mealType || 'Unknown'}`,
        `STYLE_TAG: ${recipeQuestionTarget.styleTag || 'Unknown'}`,
        `DESCRIPTION: ${recipeQuestionTarget.description || 'None'}`,
        `INGREDIENTS: ${recipeQuestionTarget.ingredients?.join(', ') || 'None'}`,
        `INSTRUCTIONS: ${recipeQuestionTarget.instructions?.join(' | ') || 'None'}`,
        `COOKING_TIPS: ${recipeQuestionTarget.cookingTips?.join(' | ') || 'None'}`,
        `TODDLER_ADAPTATION: ${recipeQuestionTarget.toddlerAdaptation || 'None'}`
      ]),
      '',
      buildPromptSection('USER QUESTION', [
        recipeQuestion.trim()
      ]),
      '',
      buildPromptSection('ANSWER RULES', [
        'Answer directly and practically.',
        'Use the recipe context above.',
        'Be concise but useful.',
        'If suggesting changes, state exactly what to change.'
      ])
    ].join('\n');

    setLastGeminiPrompt(prompt);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'text/plain' }
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) throw new Error(`API call failed with status ${response.status}`);

      const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answerText) {
        setRecipeAnswer(answerText.trim());
      } else {
        throw new Error('API returned no answer payload');
      }
    } catch {
      setError('Gemini follow-up failed. Check VITE_GEMINI_API_KEY and deployment logs.');
    } finally {
      setRecipeQuestionLoading(false);
    }
  };

  const menuContent = (
    <div className={`min-w-0 ${compactGapClass}`}>
      <section className={sectionCardClass}>
        <div className={`${isMobileLayout ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
          <div className={`${isMobileLayout ? 'rounded-lg p-2' : 'rounded-xl p-2.5'} bg-[rgba(107,114,128,0.08)] text-[#4B5563]`}><LayoutGrid size={isMobileLayout ? 14 : 16} /></div>
          <h3 className={`${isMobileLayout ? 'text-[18px]' : 'text-[20px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>Meal Profile</h3>
        </div>
        <div className={`grid ${isMobileLayout ? 'gap-3 grid-cols-1' : 'gap-5 grid-cols-3'}`}>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[12px] font-medium text-[#6B7280]">Dishes</label><span className="text-[22px] font-semibold text-[#111111]">{dishCount}</span></div><input type="range" min="1" max="6" step="1" value={dishCount} onChange={(e) => setDishCount(parseInt(e.target.value, 10))} className={trackClass} /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Light spread</span><span>Full table</span></div></div>
          <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-[12px] font-medium text-[#6B7280]">Diners</label><span className="text-[22px] font-semibold text-[#111111]">{dinerCount}</span></div><input type="range" min="2" max="8" step="1" value={dinerCount} onChange={(e) => setDinerCount(parseInt(e.target.value, 10))} className={trackClass} /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Smaller meal</span><span>Group dinner</span></div></div>
          <div className="space-y-3"><div className="flex items-center justify-between gap-4"><label className="text-[12px] font-medium text-[#6B7280]">Flavor Weight</label><span className="text-[13px] font-medium text-[#4B5563]">{getStyleLabel(styleWeight)}</span></div><input type="range" min="-100" max="100" step="20" value={styleWeight} onChange={(e) => setStyleWeight(parseInt(e.target.value, 10))} className="w-full cursor-pointer accent-[#4B5563]" /><div className="flex justify-between text-[12px] text-[#6B7280]"><span>Classic</span><span>Global</span><span>Bold</span></div></div>
        </div>
      </section>
      <div className={`grid ${isMobileLayout ? 'gap-3 grid-cols-1' : 'gap-5 grid-cols-2'}`}>
        <IngredientBlock title="Proteins" items={proteins} options={PROTEIN_OPTIONS} type="protein" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} compact={isMobileLayout} />
        <IngredientBlock title="Veggies" items={fibers} options={FIBER_OPTIONS} type="fiber" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} compact={isMobileLayout} />
      </div>
      <section className={sectionCardClass}>
        <div className={`${isMobileLayout ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
          <div className={`${isMobileLayout ? 'rounded-lg p-2' : 'rounded-xl p-2.5'} bg-[rgba(107,114,128,0.08)] text-[#4B5563]`}><Settings2 size={isMobileLayout ? 14 : 16} /></div>
          <h3 className={`${isMobileLayout ? 'text-[18px]' : 'text-[20px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>Kitchen Settings</h3>
        </div>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
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
        </div>
      </section>
    </div>
  );

  const rulesContent = (
    <Section title="Dietary Rules" icon={ShieldCheck} compact={isMobileLayout}>
      <div className={isMobileLayout ? 'space-y-4' : 'space-y-6'}>
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
              <div key={rule.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[rgba(107,114,128,0.08)] ${isMobileLayout ? 'px-3 py-3' : 'px-4 py-4'}`}>
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
    <section className={`min-w-0 ${isMobileLayout ? 'space-y-3' : 'space-y-5'} pb-20 pt-2`}>
      <Section title="Saved Recipes" icon={Star} compact={isMobileLayout}>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
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
              <div key={recipe.id} className="rounded-2xl border border-[#EEEEEE] bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] sm:px-5">
                <button
                  onClick={() => setSelectedSavedRecipe(recipe)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setActiveSavedRecipeActions(recipe);
                  }}
                  onTouchStart={() => startSavedRecipeLongPress(recipe)}
                  onTouchEnd={clearLongPressTimer}
                  onTouchMove={clearLongPressTimer}
                  onTouchCancel={clearLongPressTimer}
                  className="min-w-0 w-full text-left"
                >
                  <h3 className="break-words text-[17px] font-semibold leading-snug text-[#111111]">{recipe.title}</h3>
                  <p className="mt-1 break-words text-[14px] capitalize text-[#6B7280]">{recipe.mealType}</p>
                </button>
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

  const developerContent = (
    <section className={`min-w-0 ${isMobileLayout ? 'space-y-3' : 'space-y-5'} pb-20 pt-2`}>
      <Section title="Developer" icon={Menu} compact={isMobileLayout}>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Last Gemini Prompt</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
              This shows the exact prompt most recently sent to the Gemini API.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA]">
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-[13px] leading-relaxed text-[#111111]">
              {lastGeminiPrompt || 'No Gemini prompt has been sent yet.'}
            </pre>
          </div>
        </div>
      </Section>
    </section>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA] pb-20 text-[#111111]">
      <header className={`sticky top-0 z-30 border-b border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.6)] px-4 backdrop-blur-[12px] ${isMobileLayout ? 'py-3' : 'py-4'}`}>
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <div className={`flex min-w-0 ${isMobileLayout ? 'items-start justify-between gap-3' : 'items-center justify-between gap-6'}`}>
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => setIsNavOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:bg-[#F7F8FA]"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <div className={`rounded-2xl border border-[#E5E7EB] bg-white text-[#111111] shadow-[0_6px_20px_rgba(0,0,0,0.04)] ${isMobileLayout ? 'p-2.5' : 'p-3'}`}><ChefHat size={isMobileLayout ? 22 : 28} /></div>
              <div className="min-w-0"><h1 className={`break-words font-bold tracking-[-0.03em] text-[#111111] ${isMobileLayout ? 'text-[24px]' : 'text-[30px]'}`}>Culina<span className="text-[#4B5563]">Fusion</span></h1><p className="mt-1 text-[12px] text-[#6B7280]">Tailored gastronomy engine</p></div>
            </div>
            <div className={`flex min-w-0 ${isMobileLayout ? 'justify-end' : 'flex-wrap items-center justify-end'} gap-3`}>
              <div className={`flex rounded-full border border-[#E5E7EB] bg-[#F3F4F6] p-1 ${isMobileLayout ? 'scale-90 origin-top-right' : ''}`}>
                <button onClick={() => setLayoutMode('mobile')} className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition ${isMobileLayout ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`} aria-label="Portrait layout"><Smartphone size={12} /></button>
                <button onClick={() => setLayoutMode('desktop')} className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[11px] font-medium transition ${!isMobileLayout ? 'bg-[#4B5563] text-white' : 'text-[#6B7280]'}`} aria-label="Desktop layout"><Monitor size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isNavOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(17,17,17,0.35)]" onClick={() => setIsNavOpen(false)}>
          <aside
            className="h-full w-[min(18rem,82vw)] border-r border-[#E5E7EB] bg-white px-4 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Navigate</p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#111111]">CulinaFusion</h2>
              </div>
              <button
                onClick={() => setIsNavOpen(false)}
                className="rounded-lg p-2 text-[#6B7280] transition hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"
                aria-label="Close navigation menu"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { id: 'main', label: 'Main Page', icon: LayoutGrid },
                { id: 'saved', label: 'Saved Recipes', icon: Star },
                { id: 'rules', label: 'Dietary Rules', icon: ShieldCheck },
                { id: 'developer', label: 'Developer', icon: Menu }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setCurrentView(id);
                    setIsNavOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-medium transition ${
                    currentView === id
                      ? 'bg-[#4B5563] text-white'
                      : 'text-[#4B5563] hover:bg-[rgba(107,114,128,0.08)]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className={`mx-auto w-full min-w-0 px-4 ${isMobileLayout ? 'max-w-md pt-5' : 'max-w-6xl pt-8'}`}>
        {currentView === 'main' ? (
          <>
            <div className="min-w-0">{menuContent}</div>

            <div className={`${isMobileLayout ? 'mt-5' : 'mt-8'} flex justify-center`}>
              <button onClick={() => generateRecipes(false)} disabled={loading} className={`flex w-full max-w-6xl items-center justify-center gap-3 rounded-xl bg-[#4B5563] font-semibold text-white shadow-[0_10px_24px_rgba(75,85,99,0.18)] transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB] ${isMobileLayout ? 'px-5 py-3.5 text-[14px]' : 'px-6 py-4 text-[15px]'}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>{loading ? 'Generating menu...' : 'Construct Menu'}</span>
              </button>
            </div>
            {error && <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-medium text-[#6B7280] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">{error}</div>}

            {generatedRecipes.length > 0 && (
              <section className={`${isMobileLayout ? 'pb-16 pt-6' : 'pb-20 pt-10'}`}>
                <div className={`${isMobileLayout ? 'mb-5' : 'mb-8'} flex flex-wrap items-end justify-between gap-4`}><div className="min-w-0"><p className="text-[12px] text-[#6B7280]">Results</p><h2 className={`mt-2 break-words font-semibold tracking-[-0.03em] text-[#111111] ${isMobileLayout ? 'text-[24px]' : 'text-[30px]'}`}>Executive Menu</h2></div><div className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[12px] font-medium text-[#6B7280] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">{isMobileLayout ? 'Portrait Layout' : 'Desktop Layout'}</div></div>
                <div className={isMobileLayout ? 'space-y-4' : 'space-y-8'}>
                  {generatedRecipes.map((recipe, index) => (
                    <article key={index} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
                      <div className={isMobileLayout ? 'border-b border-[#EEEEEE] px-4 py-4' : 'flex min-w-0 flex-col lg:flex-row'}>
                        <div className={`${isMobileLayout ? 'pr-10' : 'min-w-0 border-b border-[#EEEEEE] p-8 pr-14 lg:w-[30%] lg:border-b-0 lg:border-r'} relative`}>
                          <button
                            onClick={() => {
                              const savedRecipe = getSavedGeneratedRecipe(recipe);
                              if (savedRecipe) {
                                toggleFavoriteRecipe(savedRecipe.id, savedRecipe.isFavorite);
                              } else {
                                saveRecipe({
                                  ...buildSavedRecipePayload(recipe, mealType),
                                  isFavorite: true
                                });
                              }
                            }}
                            className={`absolute right-0 top-0 rounded-full p-2 transition duration-200 ease-out ${
                              getSavedGeneratedRecipe(recipe)?.isFavorite
                                ? 'text-[#F59E0B]'
                                : 'text-[#9CA3AF] hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]'
                            } ${isMobileLayout ? 'mr-0 mt-0' : 'mr-8 mt-8'}`}
                            aria-label={getSavedGeneratedRecipe(recipe)?.isFavorite ? 'Saved as favorite' : 'Save recipe as favorite'}
                          >
                            <Star size={20} fill={getSavedGeneratedRecipe(recipe)?.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <span className="mb-3 block text-[12px] font-medium text-[#4B5563]">{recipe.styleTag}</span>
                          <h3 className={`${isMobileLayout ? 'text-[20px]' : 'text-[30px]'} font-semibold leading-tight text-[#111111]`}>{recipe.name}</h3>
                          {recipe.chineseName && <p className={`${isMobileLayout ? 'text-[14px]' : 'text-[16px]'} mt-1.5 text-[#6B7280]`}>{recipe.chineseName}</p>}
                          <p className={`text-[15px] leading-relaxed text-[#6B7280] ${isMobileLayout ? 'mt-3' : 'mt-4'}`}>{recipe.description}</p>
                          <div className={`${isMobileLayout ? 'mt-3' : 'mt-5'} flex flex-wrap gap-2`}>
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Clock size={12} className="mr-2 text-[#4B5563]" />{recipe.prepTime}</div>
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Flame size={12} className="mr-2 text-[#4B5563]" />{recipe.cookTime}</div>
                          </div>
                        </div>
                        <div className={isMobileLayout ? 'min-w-0 space-y-5 px-4 py-4' : 'min-w-0 p-8 lg:w-[70%]'}>
                          <div className={`grid min-w-0 ${isMobileLayout ? 'gap-5 grid-cols-1' : 'gap-8 lg:grid-cols-3 lg:gap-8'}`}>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Ingredients</h4><ul className="space-y-3 text-[15px] text-[#111111]">{recipe.ingredients.map((ingredient, itemIndex) => <li key={itemIndex} className="flex items-start"><span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6B7280]" />{ingredient}</li>)}</ul></div>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Execution</h4><ol className="space-y-4 text-[15px]">{recipe.instructions.map((step, stepIndex) => <li key={stepIndex} className="flex gap-3"><span className="pt-0.5 text-[13px] font-semibold text-[#4B5563]">{stepIndex + 1}.</span><span className="leading-relaxed text-[#6B7280]">{step}</span></li>)}</ol></div>
                            <div><h4 className="mb-4 text-[13px] font-medium text-[#6B7280]">Cooking Tips</h4><ul className="space-y-3 text-[15px]">{recipe.cookingTips?.map((tip, tipIndex) => <li key={tipIndex} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 leading-relaxed text-[#6B7280]">{tip}</li>)}</ul></div>
                          </div>
                        </div>
                      </div>
                      {isToddlerFriendly && recipe.toddlerAdaptation && <div className={`${isMobileLayout ? 'px-4 py-4' : 'flex items-start gap-4 p-8'} border-t border-[#E5E7EB] bg-[rgba(107,114,128,0.08)]`}><div className={`${isMobileLayout ? 'mb-2 flex items-center gap-2' : 'rounded-xl bg-[#4B5563] p-3 text-white'} text-[12px] font-medium text-[#4B5563]`}>{isMobileLayout ? <><Baby size={14} />Toddler Adaptation</> : <Baby size={20} />}</div><div><h5 className={`${isMobileLayout ? 'sr-only' : 'mb-1'} text-[12px] font-medium text-[#4B5563]`}>{isMobileLayout ? 'Toddler Adaptation' : 'Toddler Adaptation Advice'}</h5><p className="text-[15px] leading-relaxed text-[#6B7280]">{recipe.toddlerAdaptation}</p></div></div>}
                    </article>
                  ))}
                </div>

                <div className={`overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)] ${isMobileLayout ? 'mt-5 p-4' : 'mt-10 p-8'}`}>
                  <div className="mb-3 flex items-center gap-3 text-[12px] font-medium text-[#4B5563]"><Undo2 size={16} /><span>Surgical Tweak</span></div>
                  <h3 className="text-[22px] font-semibold text-[#111111]">Refine specific dishes?</h3>
              <div className={`mt-5 flex min-w-0 gap-4 ${isMobileLayout ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                    <textarea className="min-h-[112px] flex-1 rounded-xl border border-[#E5E7EB] bg-white p-5 text-[15px] text-[#111111] outline-none placeholder:text-[#6B7280] focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)]" placeholder="e.g. Swap salmon for sea bass..." value={followUpComment} onChange={(e) => setFollowUpComment(e.target.value)} />
                    <button onClick={() => generateRecipes(true)} disabled={loading || !followUpComment.trim()} className="flex items-center justify-center gap-3 rounded-xl bg-[#4B5563] px-10 py-4 text-[14px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] active:scale-[0.98] disabled:opacity-40"><RefreshCcw size={18} />Update</button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : currentView === 'saved' ? (
          savedRecipesContent
        ) : currentView === 'rules' ? (
          rulesContent
        ) : (
          developerContent
        )}
      </main>

      {selectedSavedRecipe && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(17,17,17,0.45)] p-4 sm:items-center">
          <div className={`flex max-h-[calc(100vh-2rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_20px_48px_rgba(0,0,0,0.18)] ${isMobileLayout ? 'max-w-[calc(100vw-2rem)]' : 'max-w-[min(64rem,calc(100vw-2rem))]'}`}>
            <div className="flex shrink-0 items-start justify-between border-b border-[#E5E7EB] px-6 py-5">
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="min-w-0">
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
                <div className="grid min-w-0 gap-6 md:grid-cols-2">
                  <div className="min-w-0">
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
                  <div className="min-w-0">
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

      {activeSavedRecipeActions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setActiveSavedRecipeActions(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#EEEEEE] bg-white p-4 shadow-[0_20px_48px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Saved Recipe</p>
              <h3 className="mt-2 break-words text-[18px] font-semibold text-[#111111]">{activeSavedRecipeActions.title}</h3>
              <p className="mt-1 text-[14px] capitalize text-[#6B7280]">{activeSavedRecipeActions.mealType}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  toggleFavoriteRecipe(activeSavedRecipeActions.id, activeSavedRecipeActions.isFavorite);
                  setActiveSavedRecipeActions(null);
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[14px] font-semibold transition duration-200 ease-out ${
                  activeSavedRecipeActions.isFavorite
                    ? 'border-[#4B5563] bg-[rgba(107,114,128,0.08)] text-[#4B5563]'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                }`}
              >
                <Star size={16} fill={activeSavedRecipeActions.isFavorite ? 'currentColor' : 'none'} />
                <span>{activeSavedRecipeActions.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}</span>
              </button>
              <button
                onClick={() => {
                  deleteSavedRecipe(activeSavedRecipeActions.id);
                  setActiveSavedRecipeActions(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.08)]"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => {
                  setSelectedSavedRecipe(activeSavedRecipeActions);
                  setActiveSavedRecipeActions(null);
                }}
                className="flex w-full items-center justify-center rounded-xl bg-[#4B5563] px-4 py-3 text-[14px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151]"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setRecipeQuestionTarget(activeSavedRecipeActions);
                  setRecipeQuestion('');
                  setRecipeAnswer('');
                  setActiveSavedRecipeActions(null);
                }}
                className="flex w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-semibold text-[#4B5563] transition duration-200 ease-out hover:bg-[rgba(107,114,128,0.08)]"
              >
                Ask AI Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {recipeQuestionTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setRecipeQuestionTarget(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#EEEEEE] bg-white p-4 shadow-[0_20px_48px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Ask AI</p>
                <h3 className="mt-2 break-words text-[18px] font-semibold text-[#111111]">{recipeQuestionTarget.title}</h3>
              </div>
              <button
                onClick={() => setRecipeQuestionTarget(null)}
                className="rounded-lg p-2 text-[#6B7280] transition hover:bg-[rgba(107,114,128,0.08)] hover:text-[#4B5563]"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <textarea
                className="min-h-[112px] w-full rounded-xl border border-[#E5E7EB] bg-white p-4 text-[15px] text-[#111111] outline-none placeholder:text-[#6B7280] focus:border-[#6B7280] focus:ring-2 focus:ring-[rgba(107,114,128,0.12)]"
                placeholder="Ask about substitutions, timing, technique, serving ideas, or adjustments..."
                value={recipeQuestion}
                onChange={(e) => setRecipeQuestion(e.target.value)}
              />
              <button
                onClick={askRecipeFollowUp}
                disabled={recipeQuestionLoading || !recipeQuestion.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4B5563] px-4 py-3 text-[14px] font-semibold text-white transition duration-200 ease-out hover:bg-[#374151] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
              >
                {recipeQuestionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                <span>{recipeQuestionLoading ? 'Asking AI...' : 'Ask AI'}</span>
              </button>
              {recipeAnswer && (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-4">
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Answer</p>
                  <p className="text-[15px] leading-relaxed text-[#111111]">{recipeAnswer}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
