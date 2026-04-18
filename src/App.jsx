import React, { useEffect, useRef, useState } from 'react';
import {
  Baby, ChefHat, ChevronDown, CheckSquare, Clock, Clock3, Flame, LayoutGrid, Loader2, Mars, Menu, Monitor,
  MessageSquareMore, PersonStanding, Plus, RefreshCcw, Settings2, ShieldCheck, Smartphone, Sparkles, Star,
  Trash2, Undo2, User, UserRound, Users, Venus, XCircle
} from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

const DEFAULT_PROTEIN_OPTIONS = ['Pork (Pork Belly, Sliced Pork)', 'Chicken (Thighs, Breast, Wings)', 'Beef (Flank, Sirloin, Short Ribs)', 'Tofu (Firm, Soft, Silken)', 'Fish (Whole, Fillets)', 'Shrimp / Prawns', 'Duck', 'Eggs', 'Scallops', 'Lamb'];
const DEFAULT_FIBER_OPTIONS = ['Bok Choy', 'Gai Lan (Chinese Broccoli)', 'Cabbage (Napa or Green)', 'Eggplant', 'Mushrooms (Shiitake, Enoki, Oyster)', 'Green Beans', 'Snow Peas', 'Bell Peppers', 'Lotus Root', 'Potato', 'Cucumber'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const SAVED_FILTERS = ['All', ...MEAL_TYPES];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LOCATIONS = [{ value: 'supermarket', label: 'Supermarket' }, { value: 'wet market', label: 'Wet Market' }];
const STYLE_OPTIONS = [
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Western', label: 'Western' }
];
const FAMILY_ICON_OPTIONS = [
  { value: 'baby', label: 'Baby', icon: Baby },
  { value: 'young-boy', label: 'Young Boy', icon: User, badgeIcon: Mars },
  { value: 'young-girl', label: 'Young Girl', icon: UserRound, badgeIcon: Venus },
  { value: 'man', label: 'Man', icon: PersonStanding, badgeIcon: Mars },
  { value: 'woman', label: 'Woman', icon: UserRound, badgeIcon: Venus },
  { value: 'old-man', label: 'Old Man', icon: PersonStanding, badgeIcon: Clock3 },
  { value: 'old-woman', label: 'Old Woman', icon: UserRound, badgeIcon: Clock3 }
];
const DEFAULT_DIETARY_RULES = [
  { id: 'no-spicy', text: 'No Spicy Food', order: 0 },
  { id: 'one-veg', text: '1x Strictly Vegetarian', order: 1 },
  { id: 'hk-household', text: 'Authentic Chinese mode: use top 100 Hong Kong household dishes only', order: 2 }
];

const card = 'min-w-0 rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]';
const inputClass = 'w-full rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition duration-200 ease-out focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)] placeholder:text-[#9CA3AF]';
const selectClass = 'min-w-0 w-full max-w-full rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] font-medium text-[#111111] outline-none transition duration-200 ease-out focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)]';
const primaryButtonClass = 'rounded-[10px] bg-[#111111] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.18)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB] disabled:shadow-none';
const secondaryButtonClass = 'rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111] active:scale-[0.98]';
const createEmptyWeeklyPlanner = () => (
  WEEK_DAYS.reduce((acc, day) => ({
    ...acc,
    [day]: { Breakfast: [], Lunch: [], Dinner: [] }
  }), {})
);
const GROCERY_SEASONINGS = ['salt', 'sugar', 'soy sauce', 'light soy sauce', 'dark soy sauce', 'sesame oil', 'oyster sauce', 'white pepper', 'black pepper', 'pepper', 'cornstarch', 'vinegar', 'rice vinegar', 'shaoxing wine', 'cooking wine', 'oil', 'olive oil', 'vegetable oil', 'chicken powder', 'bouillon', 'fish sauce', 'hoisin sauce'];

const normalizeWeeklyPlanner = (planner) => (
  WEEK_DAYS.reduce((acc, day) => {
    const dayPlan = planner?.[day] || {};

    acc[day] = MEAL_TYPES.reduce((slots, slot) => {
      const recipeIds = Array.isArray(dayPlan?.[slot]) ? dayPlan[slot].filter(Boolean) : [];
      slots[slot] = recipeIds;
      return slots;
    }, {});

    return acc;
  }, {})
);

function Section({ title, icon, children, compact = false }) {
  return (
    <section className={compact ? 'min-w-0 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]' : card}>
      <div className={`${compact ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
        <div className={`${compact ? 'rounded-[8px] p-2' : 'rounded-[10px] p-2.5'} bg-[rgba(17,17,17,0.05)] text-[#111111]`}>{React.createElement(icon, { size: compact ? 14 : 16 })}</div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">Section</p>
          <h3 className={`${compact ? 'text-[18px]' : 'text-[20px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function FamilyIconGlyph({ option, size = 16, badgeSize = 10 }) {
  const PrimaryIcon = option.icon;
  const BadgeIcon = option.badgeIcon;

  return (
    <span className="relative inline-flex">
      <PrimaryIcon size={size} />
      {BadgeIcon ? (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-white bg-white p-[1px] text-[#6B7280] shadow-[0_2px_6px_rgba(17,17,17,0.08)]">
          <BadgeIcon size={badgeSize} />
        </span>
      ) : null}
    </span>
  );
}

function IngredientOptionPicker({ item, options, type, index, updateIngredient, deleteIngredientOption }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedLabel = item.value === 'CUSTOM_VAL' ? 'Custom...' : item.value;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full min-w-0 items-center justify-between gap-2 bg-transparent text-left text-[15px] font-medium text-[#111111] outline-none"
      >
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full min-w-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_16px_32px_rgba(0,0,0,0.12)]">
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map((option) => (
              <div key={option} className="flex items-center gap-2 rounded-lg px-2 py-2 transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)]">
                <button
                  type="button"
                  onClick={() => {
                    updateIngredient(type, index, 'value', option);
                    setIsOpen(false);
                  }}
                  className="min-w-0 flex-1 text-left text-[14px] font-medium text-[#111111]"
                >
                  <span className="break-words [overflow-wrap:anywhere]">{option === 'CUSTOM_VAL' ? 'Custom...' : option}</span>
                </button>
                {option !== 'CUSTOM_VAL' && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteIngredientOption(type, option);
                    }}
                    className="shrink-0 rounded-[8px] px-2 py-1 text-[14px] font-semibold leading-none text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.06)] hover:text-[#111111]"
                    aria-label={`Delete ${option} from ${type} options`}
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientBlock({ title, items, options, type, dot, addIngredient, removeIngredient, updateIngredient, deleteIngredientOption, compact = false }) {
  return (
    <Section title={title} icon={Plus} compact={compact}>
      <div className={`${compact ? 'mb-3' : 'mb-4'} flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span>{items.length} selected</span>
        </div>
        <button onClick={() => addIngredient(type)} className={`flex ${compact ? 'h-8 w-8' : 'h-9 w-9'} items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937] active:scale-[0.98]`} disabled={items.length >= 4}><Plus size={compact ? 13 : 14} /></button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F7F8FA] px-4 py-5 text-center">
          <p className="text-[13px] font-medium text-[#111111]">I&apos;m feeling lucky</p>
          <p className="mt-1 text-[12px] text-[#6B7280]">
            Leave this blank and the chef will suggest {type === 'protein' ? 'proteins' : 'veggies'} for you.
          </p>
        </div>
      ) : (
        <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
          {items.map((item, index) => (
            <div key={`${type}-${index}`} className={`rounded-xl border border-[#E5E7EB] bg-white ${compact ? 'p-2.5' : 'p-3'}`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <IngredientOptionPicker item={item} options={options} type={type} index={index} updateIngredient={updateIngredient} deleteIngredientOption={deleteIngredientOption} />
                <button onClick={() => removeIngredient(type, index)} className="rounded-[8px] p-1.5 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]" aria-label={`Remove selected ${title} item`}><Trash2 size={15} /></button>
              </div>
              {item.value === 'CUSTOM_VAL' && <input type="text" placeholder={type === 'protein' ? 'Protein name...' : 'Veggie name...'} className={`${inputClass} mt-3`} value={item.customText} onChange={(e) => updateIngredient(type, index, 'customText', e.target.value)} onBlur={() => updateIngredient(type, index, 'commitCustom', item.customText)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateIngredient(type, index, 'commitCustom', item.customText); } }} />}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

const saveRecipe = async (recipe) => {
  try {
    const docRef = await addDoc(
      collection(db, 'recipes'),
      {
        ...recipe,
        createdAt: serverTimestamp()
      }
    );
    console.log('Recipe saved!');
    return docRef.id;
  } catch (e) {
    console.error('Error saving recipe:', e);
    return null;
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

const updateSavedRecipe = async (recipeId, recipe) => {
  try {
    await updateDoc(doc(db, 'recipes', recipeId), {
      ...recipe,
      title: getDisplayRecipeTitle(recipe),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error('Error updating recipe:', e);
    return false;
  }
};

const getDisplayRecipeTitle = (recipe) => {
  if (!recipe) return '';

  if (recipe.name && recipe.chineseName) return `${recipe.name} (${recipe.chineseName})`;
  if (recipe.name) return recipe.name;
  if (recipe.title && recipe.chineseName) return `${recipe.title} (${recipe.chineseName})`;
  return recipe.title || '';
};

const buildSavedRecipePayload = (recipe, mealType) => ({
  title: getDisplayRecipeTitle(recipe),
  mealType: mealType.toLowerCase(),
  isFavorite: false,
  ...recipe
});

const getNutritionSummary = (recipe) => {
  if (!recipe?.nutrition) return [];

  const entries = [
    recipe.nutrition.calories ? `${recipe.nutrition.calories} kcal` : null,
    recipe.nutrition.protein ? `${recipe.nutrition.protein} protein` : null,
    recipe.nutrition.carbs ? `${recipe.nutrition.carbs} carbs` : null,
    recipe.nutrition.fat ? `${recipe.nutrition.fat} fat` : null
  ].filter(Boolean);

  return entries;
};

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

const slugifyOption = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const slugifyGroceryItem = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

const formatTimestamp = (value) => {
  if (!value) return 'Not generated yet';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not generated yet';
  return new Intl.DateTimeFormat('en-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const normalizeGroceryIngredient = (ingredient) => {
  const raw = ingredient?.trim();
  if (!raw) return null;

  const compact = raw
    .replace(/^[\d/\s.¼½¾⅓⅔⅛⅜⅝⅞]+/u, '')
    .replace(/^(cups?|tbsp|tsp|teaspoons?|tablespoons?|cloves?|slices?|pieces?|pcs?|grams?|g|kg|ml|l)\b\.?/i, '')
    .replace(/^of\s+/i, '')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim();

  const lowered = compact.toLowerCase();
  const seasoningMatch = GROCERY_SEASONINGS.find((seasoning) => lowered.includes(seasoning));
  const baseLabel = seasoningMatch || compact || raw;
  const label = seasoningMatch ? baseLabel : raw;

  return {
    key: slugifyGroceryItem(label),
    label: label
      .split(' ')
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(' '),
    isSeasoning: Boolean(seasoningMatch)
  };
};

const useIngredientOptions = (collectionName, defaultOptions) => {
  const [options, setOptions] = useState(defaultOptions);

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy('label', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await Promise.all(
          defaultOptions.map((label) => setDoc(doc(db, collectionName, slugifyOption(label)), {
            label,
            createdAt: serverTimestamp()
          }))
        );
        return;
      }

      setOptions(snapshot.docs.map((optionDoc) => optionDoc.data().label).filter(Boolean));
    });

    return () => unsubscribe();
  }, [collectionName, defaultOptions]);

  return options;
};

const useGroceryList = () => {
  const [groceryList, setGroceryList] = useState({ generatedAt: null, items: [] });

  useEffect(() => {
    const groceryRef = doc(db, 'planner', 'groceryList');

    const unsubscribe = onSnapshot(groceryRef, async (snapshot) => {
      if (!snapshot.exists()) {
        await setDoc(groceryRef, {
          generatedAt: null,
          items: []
        });
        return;
      }

      const data = snapshot.data();
      setGroceryList({
        generatedAt: data.generatedAt ?? null,
        items: Array.isArray(data.items) ? data.items : []
      });
    });

    return () => unsubscribe();
  }, []);

  return groceryList;
};

const useFamilyProfiles = () => {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'familyProfiles'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProfiles(snapshot.docs.map((profileDoc) => ({
        id: profileDoc.id,
        ...profileDoc.data()
      })));
    });

    return () => unsubscribe();
  }, []);

  return profiles;
};

export default function App() {
  const [layoutMode, setLayoutMode] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [currentView, setCurrentView] = useState('main');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [dishCount, setDishCount] = useState(3);
  const [dinerCount, setDinerCount] = useState(3);
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [selectedFamilyProfileIds, setSelectedFamilyProfileIds] = useState([]);
  const [isToddlerFriendly, setIsToddlerFriendly] = useState(false);
  const [styleWeight, setStyleWeight] = useState('Chinese');
  const [flavorHealthBalance, setFlavorHealthBalance] = useState(50);
  const proteinOptions = useIngredientOptions('proteinOptions', DEFAULT_PROTEIN_OPTIONS);
  const fiberOptions = useIngredientOptions('fiberOptions', DEFAULT_FIBER_OPTIONS);
  const [proteins, setProteins] = useState([]);
  const [fibers, setFibers] = useState([]);
  const [mealType, setMealType] = useState(MEAL_TYPES[2]);
  const [todayPreference, setTodayPreference] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [isKitchenSettingsExpanded, setIsKitchenSettingsExpanded] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [familyProfileName, setFamilyProfileName] = useState('');
  const [familyProfileIcon, setFamilyProfileIcon] = useState(FAMILY_ICON_OPTIONS[0].value);
  const [familyProfileDietary, setFamilyProfileDietary] = useState('');
  const [editingFamilyProfileId, setEditingFamilyProfileId] = useState(null);
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followUpComment, setFollowUpComment] = useState('');
  const [lastGeminiPrompt, setLastGeminiPrompt] = useState('');
  const recipes = useRecipes();
  const dietaryRules = useDietaryRules();
  const familyProfiles = useFamilyProfiles();
  const groceryList = useGroceryList();
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState(null);
  const [activeSavedRecipeActions, setActiveSavedRecipeActions] = useState(null);
  const [plannerPickerTarget, setPlannerPickerTarget] = useState(null);
  const [plannerAssignmentTarget, setPlannerAssignmentTarget] = useState(null);
  const [groceryPlannerDaysTarget, setGroceryPlannerDaysTarget] = useState(null);
  const [recipeQuestionTarget, setRecipeQuestionTarget] = useState(null);
  const [recipeQuestion, setRecipeQuestion] = useState('');
  const [recipeAnswer, setRecipeAnswer] = useState('');
  const [recipeQuestionLoading, setRecipeQuestionLoading] = useState(false);
  const [recipeTuneTarget, setRecipeTuneTarget] = useState(null);
  const [recipeTunePrompt, setRecipeTunePrompt] = useState('');
  const [recipeTuneDraft, setRecipeTuneDraft] = useState(null);
  const [recipeTuneLoading, setRecipeTuneLoading] = useState(false);
  const [weeklyPlanner, setWeeklyPlanner] = useState(createEmptyWeeklyPlanner);
  const [savedMealFilter, setSavedMealFilter] = useState('All');
  const [savedSearch, setSavedSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [newGroceryItem, setNewGroceryItem] = useState('');
  const longPressTimerRef = useRef(null);
  const hasLoadedWeeklyPlannerRef = useRef(false);
  const lastSyncedWeeklyPlannerRef = useRef(JSON.stringify(createEmptyWeeklyPlanner()));
  const hasInitializedFamilySelectionRef = useRef(false);
  const hasLoadedDinerStateRef = useRef(false);
  const lastSyncedDinerStateRef = useRef('');

  const isMobileLayout = layoutMode === 'mobile';
  const trackClass = 'w-full cursor-pointer accent-[#111111]';
  const sectionCardClass = isMobileLayout ? 'min-w-0 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]' : card;
  const compactGapClass = isMobileLayout ? 'space-y-3' : 'space-y-5';
  const getSavedGeneratedRecipe = (recipe) => recipes.find((savedRecipe) => savedRecipe.title === getRecipeTitle(recipe, mealType));
  const getRecipeById = (recipeId) => recipes.find((recipe) => recipe.id === recipeId);
  const proteinDropdownOptions = [...proteinOptions, 'CUSTOM_VAL'];
  const fiberDropdownOptions = [...fiberOptions, 'CUSTOM_VAL'];
  const selectedFamilyProfiles = familyProfiles.filter((profile) => selectedFamilyProfileIds.includes(profile.id));
  const activeDinerCount = isFamilyMode ? Math.max(selectedFamilyProfiles.length, 1) : dinerCount;
  const hasToddlerFamilyProfile = selectedFamilyProfiles.some((profile) => ['baby', 'young-boy', 'young-girl'].includes(profile.icon));
  const selectedFamilyDietaryRequirements = selectedFamilyProfiles
    .map((profile) => `${profile.name}: ${profile.dietaryRequirements?.trim() || 'None'}`)
    .filter(Boolean);

  useEffect(() => {
    setSelectedFamilyProfileIds((current) => current.filter((id) => familyProfiles.some((profile) => profile.id === id)));

    if (!hasInitializedFamilySelectionRef.current && familyProfiles.length > 0) {
      setSelectedFamilyProfileIds(familyProfiles.map((profile) => profile.id));
      hasInitializedFamilySelectionRef.current = true;
    }
  }, [familyProfiles]);

  useEffect(() => {
    setIsToddlerFriendly(isFamilyMode ? hasToddlerFamilyProfile : false);
  }, [isFamilyMode, hasToddlerFamilyProfile, dinerCount, selectedFamilyProfileIds]);

  useEffect(() => {
    const dinerStateRef = doc(db, 'planner', 'diners');

    const unsubscribe = onSnapshot(dinerStateRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const defaultState = {
          mode: 'general',
          dinerCount: 3,
          selectedFamilyProfileIds: []
        };
        await setDoc(dinerStateRef, {
          ...defaultState,
          updatedAt: serverTimestamp()
        }, { merge: true });
        lastSyncedDinerStateRef.current = JSON.stringify(defaultState);
        return;
      }

      const data = snapshot.data() || {};
      const normalizedState = {
        mode: data.mode === 'family' ? 'family' : 'general',
        dinerCount: Number.isFinite(data.dinerCount) ? data.dinerCount : 3,
        selectedFamilyProfileIds: Array.isArray(data.selectedFamilyProfileIds) ? data.selectedFamilyProfileIds.filter(Boolean) : []
      };

      setIsFamilyMode(normalizedState.mode === 'family');
      setDinerCount(normalizedState.dinerCount);
      setSelectedFamilyProfileIds(normalizedState.selectedFamilyProfileIds);
      hasInitializedFamilySelectionRef.current = true;
      lastSyncedDinerStateRef.current = JSON.stringify(normalizedState);
      hasLoadedDinerStateRef.current = true;
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasLoadedDinerStateRef.current) return;

    const dinerState = {
      mode: isFamilyMode ? 'family' : 'general',
      dinerCount,
      selectedFamilyProfileIds
    };
    const serializedDinerState = JSON.stringify(dinerState);
    if (serializedDinerState === lastSyncedDinerStateRef.current) return;

    lastSyncedDinerStateRef.current = serializedDinerState;
    setDoc(doc(db, 'planner', 'diners'), {
      ...dinerState,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [isFamilyMode, dinerCount, selectedFamilyProfileIds]);

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

  useEffect(() => {
    const weeklyPlannerRef = doc(db, 'planner', 'weekly');

    const unsubscribe = onSnapshot(weeklyPlannerRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const emptyPlanner = createEmptyWeeklyPlanner();
        await setDoc(weeklyPlannerRef, {
          plan: emptyPlanner,
          updatedAt: serverTimestamp()
        });
        lastSyncedWeeklyPlannerRef.current = JSON.stringify(emptyPlanner);
        return;
      }

      const normalizedPlanner = normalizeWeeklyPlanner(snapshot.data()?.plan);
      lastSyncedWeeklyPlannerRef.current = JSON.stringify(normalizedPlanner);
      setWeeklyPlanner(normalizedPlanner);
      hasLoadedWeeklyPlannerRef.current = true;
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasLoadedWeeklyPlannerRef.current) return;
    const serializedPlanner = JSON.stringify(weeklyPlanner);
    if (serializedPlanner === lastSyncedWeeklyPlannerRef.current) return;

    const weeklyPlannerRef = doc(db, 'planner', 'weekly');
    lastSyncedWeeklyPlannerRef.current = serializedPlanner;
    setDoc(weeklyPlannerRef, {
      plan: weeklyPlanner,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [weeklyPlanner]);

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
  const saveFamilyProfile = async () => {
    if (!familyProfileName.trim()) return;

    const payload = {
      name: familyProfileName.trim(),
      icon: familyProfileIcon,
      dietaryRequirements: familyProfileDietary.trim()
    };

    if (editingFamilyProfileId) {
      await updateDoc(doc(db, 'familyProfiles', editingFamilyProfileId), payload);
    } else {
      await addDoc(collection(db, 'familyProfiles'), {
        ...payload,
        createdAt: serverTimestamp()
      });
    }

    setFamilyProfileName('');
    setFamilyProfileIcon(FAMILY_ICON_OPTIONS[0].value);
    setFamilyProfileDietary('');
    setEditingFamilyProfileId(null);
  };
  const startEditingFamilyProfile = (profile) => {
    setEditingFamilyProfileId(profile.id);
    setFamilyProfileName(profile.name || '');
    setFamilyProfileIcon(profile.icon || FAMILY_ICON_OPTIONS[0].value);
    setFamilyProfileDietary(profile.dietaryRequirements || '');
  };
  const cancelEditingFamilyProfile = () => {
    setEditingFamilyProfileId(null);
    setFamilyProfileName('');
    setFamilyProfileIcon(FAMILY_ICON_OPTIONS[0].value);
    setFamilyProfileDietary('');
  };
  const removeFamilyProfile = async (id) => {
    await deleteDoc(doc(db, 'familyProfiles', id));
    if (editingFamilyProfileId === id) cancelEditingFamilyProfile();
  };
  const toggleFamilyProfileSelection = (profileId) => {
    setSelectedFamilyProfileIds((current) => (
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId]
    ));
  };
  const getFamilyProfileIcon = (iconValue) => (
    FAMILY_ICON_OPTIONS.find((option) => option.value === iconValue) || FAMILY_ICON_OPTIONS[0]
  );
  const addIngredient = (type) => {
    const entry = { value: type === 'protein' ? (proteinOptions[0] || DEFAULT_PROTEIN_OPTIONS[0]) : (fiberOptions[0] || DEFAULT_FIBER_OPTIONS[0]), customText: '' };
    if (type === 'protein' && proteins.length < 4) setProteins([...proteins, entry]);
    if (type === 'fiber' && fibers.length < 4) setFibers([...fibers, entry]);
  };
  const removeIngredient = (type, index) => {
    if (type === 'protein') setProteins(proteins.filter((_, i) => i !== index));
    if (type === 'fiber') setFibers(fibers.filter((_, i) => i !== index));
  };
  const saveIngredientOption = async (type, label) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return null;

    const existingOptions = type === 'protein' ? proteinOptions : fiberOptions;
    const matchedOption = existingOptions.find((option) => option.toLowerCase() === trimmedLabel.toLowerCase());
    if (matchedOption) return matchedOption;

    const collectionName = type === 'protein' ? 'proteinOptions' : 'fiberOptions';
    await setDoc(doc(db, collectionName, slugifyOption(trimmedLabel)), {
      label: trimmedLabel,
      createdAt: serverTimestamp()
    }, { merge: true });

    return trimmedLabel;
  };
  const deleteIngredientOption = async (type, label) => {
    const collectionName = type === 'protein' ? 'proteinOptions' : 'fiberOptions';
    await deleteDoc(doc(db, collectionName, slugifyOption(label)));
  };
  const updateIngredient = async (type, index, field, value) => {
    const target = type === 'protein' ? proteins : fibers;
    const setter = type === 'protein' ? setProteins : setFibers;
    if (field === 'commitCustom') {
      const savedOption = await saveIngredientOption(type, value);
      if (!savedOption) return;
      setter(target.map((item, itemIndex) => (itemIndex === index ? { value: savedOption, customText: '' } : item)));
      return;
    }

    setter(target.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === 'value' && value === 'CUSTOM_VAL') return { value, customText: '' };
      return { ...item, [field]: value };
    }));
  };

  const getStyleLabel = (value) => value || 'Chinese';

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
    if (styleLabel === 'Chinese') {
      return 'STYLE RULES: authentic chinese, limited to top100 most popular hong kong household chinese dishes verified on the web. Keep the dishes fully Chinese in flavor, technique, naming, ingredient pairing, seasoning profile, and presentation. Do not westernize the dishes or blend in fusion elements. If a chineseName is provided, it must be written only in Traditional Chinese characters.';
    }
    if (styleLabel === 'Japanese') {
      return 'STYLE RULES: simple fusion japanese cooking that suit HK household taste and cooking style. Keep the dishes Japanese-led but practical for Hong Kong home cooking. Favor simple techniques, lighter seasoning structures, and everyday household-friendly combinations. If a chineseName is provided, it must be written only in Traditional Chinese characters.';
    }
    return 'STYLE RULES: western cooking that suit HK household taste and cooking style. Generate Western-led dishes that feel realistic and appealing for Hong Kong home cooking. Do not make them Chinese-led. Keep them practical, familiar, and household-friendly. If a chineseName is provided, it must be written only in Traditional Chinese characters.';
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
    const suggestedIngredientCount = Math.min(Math.max(activeDinerCount - 1, 1), 3);
    const toddlerInstruction = isToddlerFriendly
      ? "Include a 'toddlerAdaptation' string for each dish."
      : "Do not include toddlerAdaptation.";
    const cookingTipsInstruction = 'Include 3 to 5 short, practical, actionable cookingTips for each dish.';
    const nutritionInstruction = 'Include a nutrition object for each dish with basic estimated values: calories, protein, carbs, and fat. Keep them short human-readable strings such as "520", "32g", "18g", "24g".';
    const flavorHealthInstruction = `FLAVOR VS HEALTH: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)}). Reflect this balance in ingredient choices, cooking method, seasoning intensity, richness, and oil or sauce usage.`;
    const mealTypeInstruction = getMealTypeInstruction(mealType);
    const styleInstruction = getStyleInstruction(styleLabel);
    const familyModeInstruction = isFamilyMode
      ? `FAMILY MODE RULES: The meal must serve exactly ${activeDinerCount} active family members. Respect these selected family dietary requirements: ${selectedFamilyDietaryRequirements.join('; ')}.`
      : '';
    const ingredientFallbackInstruction = (() => {
      if (finalProteins.length === 0 && finalFibers.length === 0) {
        return `INGREDIENT SELECTION RULES: Both PROTEINS and VEGETABLES are blank. Propose up to ${suggestedIngredientCount} protein options and up to ${suggestedIngredientCount} vegetable options that fit the meal.`;
      }
      if (finalProteins.length === 0) {
        return `INGREDIENT SELECTION RULES: PROTEINS is blank. Propose up to ${suggestedIngredientCount} protein options that fit the provided vegetables and the requested meal. Do not invent extra vegetables beyond the provided list unless absolutely necessary.`;
      }
      if (finalFibers.length === 0) {
        return `INGREDIENT SELECTION RULES: VEGETABLES is blank. Propose up to ${suggestedIngredientCount} vegetable options that fit the provided proteins and the requested meal. Do not invent extra proteins beyond the provided list unless absolutely necessary.`;
      }
      return 'INGREDIENT SELECTION RULES: Use the provided proteins and vegetables as the primary anchors for the meal. Do not replace them with unrelated options unless required by dietary constraints.';
    })();
    const parameterSection = buildPromptSection('PARAMETERS', [
      `DISH_COUNT: ${dishCount}`,
      `DINER_COUNT: ${activeDinerCount}`,
      `MEAL_TYPE: ${mealType}`,
      `TODAY_PREFERENCE: ${todayPreference.trim() || 'None'}`,
      `STYLE: ${styleLabel}`,
      `FLAVOR_HEALTH_BALANCE: ${flavorHealthBalance}/100 (${getFlavorHealthLabel(flavorHealthBalance)})`,
      `DINER_MODE: ${isFamilyMode ? 'Family Profiles' : 'General Slider'}`,
      `FAMILY_DIETARY_REQUIREMENTS: ${selectedFamilyDietaryRequirements.join('; ') || 'None'}`,
      `TODDLER_MODE: ${isToddlerFriendly ? 'ON' : 'OFF'}`,
      `SHOPPING_SOURCE: ${location}`,
      `PROTEINS: ${finalProteins.join(', ') || 'None'}`,
      `VEGETABLES: ${finalFibers.join(', ') || 'None'}`,
      `DIETARY_RULES: ${activeRules.join('; ') || 'None'}`
    ]);
    const instructionSection = buildPromptSection('INSTRUCTIONS', [
      mealTypeInstruction,
      styleInstruction,
      flavorHealthInstruction,
      familyModeInstruction,
      ingredientFallbackInstruction,
      toddlerInstruction,
      cookingTipsInstruction,
      nutritionInstruction
    ]);
    const outputSection = buildPromptSection('OUTPUT REQUIREMENTS', [
      `Return exactly ${dishCount} recipe objects as JSON.`,
      'Each recipe must match the requested meal type, style, and dietary constraints.',
      'Honor the ingredient selection rules above when deciding whether to use provided ingredients or propose missing ones.',
      'Include basic estimated nutrition details for each recipe.',
      'If chineseName is included, use Traditional Chinese only. Never use Simplified Chinese.',
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
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, chineseName: { type: 'STRING' }, styleTag: { type: 'STRING' }, description: { type: 'STRING' }, prepTime: { type: 'STRING' }, cookTime: { type: 'STRING' }, nutrition: { type: 'OBJECT', properties: { calories: { type: 'STRING' }, protein: { type: 'STRING' }, carbs: { type: 'STRING' }, fat: { type: 'STRING' } } }, ingredients: { type: 'ARRAY', items: { type: 'STRING' } }, instructions: { type: 'ARRAY', items: { type: 'STRING' } }, cookingTips: { type: 'ARRAY', items: { type: 'STRING' } }, toddlerAdaptation: { type: 'STRING' } }, required: ['name', 'styleTag', 'description', 'prepTime', 'cookTime', 'ingredients', 'instructions', 'cookingTips', 'nutrition'] } } } };
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

  const openRecipeTuneModal = (recipe) => {
    setRecipeTuneTarget(recipe);
    setRecipeTunePrompt('');
    setRecipeTuneDraft(null);
  };

  const requestRecipeTune = async () => {
    if (!recipeTuneTarget || !recipeTunePrompt.trim()) return;

    setRecipeTuneLoading(true);
    setError('');
    setRecipeTuneDraft(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = 'gemini-3.1-flash-lite-preview';
    if (!apiKey) {
      setError('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      setRecipeTuneLoading(false);
      return;
    }

    const prompt = [
      'ROLE',
      'You are a practical cooking assistant updating an existing saved recipe based on user modification requests.',
      '',
      buildPromptSection('RECIPE CONTEXT', [
        `TITLE: ${getDisplayRecipeTitle(recipeTuneTarget) || 'Unknown'}`,
        `MEAL_TYPE: ${recipeTuneTarget.mealType || 'Unknown'}`,
        `STYLE_TAG: ${recipeTuneTarget.styleTag || 'Unknown'}`,
        `DESCRIPTION: ${recipeTuneTarget.description || 'None'}`,
        `PREP_TIME: ${recipeTuneTarget.prepTime || 'Unknown'}`,
        `COOK_TIME: ${recipeTuneTarget.cookTime || 'Unknown'}`,
        `NUTRITION: ${recipeTuneTarget.nutrition ? JSON.stringify(recipeTuneTarget.nutrition) : 'None'}`,
        `INGREDIENTS: ${recipeTuneTarget.ingredients?.join(' | ') || 'None'}`,
        `INSTRUCTIONS: ${recipeTuneTarget.instructions?.join(' | ') || 'None'}`,
        `COOKING_TIPS: ${recipeTuneTarget.cookingTips?.join(' | ') || 'None'}`,
        `TODDLER_ADAPTATION: ${recipeTuneTarget.toddlerAdaptation || 'None'}`
      ]),
      '',
      buildPromptSection('MODIFICATION REQUEST', [
        recipeTunePrompt.trim()
      ]),
      '',
      buildPromptSection('OUTPUT REQUIREMENTS', [
        'Return one full updated recipe object as JSON.',
        'Keep the recipe coherent and practical.',
        'Preserve the overall spirit of the original recipe unless the request clearly changes it.',
        'Use Traditional Chinese only if chineseName is included.',
        'Return fields: name, chineseName, styleTag, description, prepTime, cookTime, nutrition, ingredients, instructions, cookingTips, toddlerAdaptation.'
      ])
    ].join('\n');

    setLastGeminiPrompt(prompt);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                chineseName: { type: 'STRING' },
                styleTag: { type: 'STRING' },
                description: { type: 'STRING' },
                prepTime: { type: 'STRING' },
                cookTime: { type: 'STRING' },
                nutrition: {
                  type: 'OBJECT',
                  properties: {
                    calories: { type: 'STRING' },
                    protein: { type: 'STRING' },
                    carbs: { type: 'STRING' },
                    fat: { type: 'STRING' }
                  }
                },
                ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
                instructions: { type: 'ARRAY', items: { type: 'STRING' } },
                cookingTips: { type: 'ARRAY', items: { type: 'STRING' } },
                toddlerAdaptation: { type: 'STRING' }
              },
              required: ['name', 'styleTag', 'description', 'prepTime', 'cookTime', 'nutrition', 'ingredients', 'instructions', 'cookingTips']
            }
          }
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) throw new Error(`API call failed with status ${response.status}`);

      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error('API returned no recipe payload');

      const parsedRecipe = JSON.parse(resultText);
      setRecipeTuneDraft({
        ...recipeTuneTarget,
        ...parsedRecipe,
        mealType: recipeTuneTarget.mealType,
        isFavorite: recipeTuneTarget.isFavorite
      });
    } catch {
      setError('Gemini recipe update failed. Check VITE_GEMINI_API_KEY and deployment logs.');
    } finally {
      setRecipeTuneLoading(false);
    }
  };

  const keepRecipeTune = async () => {
    if (!recipeTuneTarget?.id || !recipeTuneDraft) return;

    const success = await updateSavedRecipe(recipeTuneTarget.id, recipeTuneDraft);
    if (!success) {
      setError('Unable to save updated recipe.');
      return;
    }

    setSelectedSavedRecipe((current) => (current?.id === recipeTuneTarget.id ? { ...current, ...recipeTuneDraft } : current));
    setActiveSavedRecipeActions((current) => (current?.id === recipeTuneTarget.id ? { ...current, ...recipeTuneDraft } : current));
    setRecipeTuneTarget(null);
    setRecipeTuneDraft(null);
    setRecipeTunePrompt('');
  };

  const assignRecipeToPlannerSlot = (day, slot, dishIndex, recipeId) => {
    setWeeklyPlanner((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [slot]: dishIndex >= current[day][slot].length
          ? [...current[day][slot], recipeId]
          : current[day][slot]
            .map((dishId, index) => (index === dishIndex ? recipeId : dishId))
            .filter(Boolean)
      }
    }));
  };

  const addDishToPlannerSlot = (day, slot) => {
    setPlannerPickerTarget({
      day,
      slot,
      dishIndex: weeklyPlanner[day][slot].filter(Boolean).length
    });
  };

  const removeRecipeFromPlannerSlot = (day, slot, dishIndex) => {
    setWeeklyPlanner((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [slot]: current[day][slot].filter((_, index) => index !== dishIndex)
      }
    }));
  };

  const openPlannerRecipePicker = (day, slot, dishIndex) => {
    setPlannerPickerTarget({ day, slot, dishIndex });
  };

  const appendRecipeToPlannerSlot = (day, slot, recipeId) => {
    setWeeklyPlanner((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [slot]: [...current[day][slot], recipeId].filter(Boolean)
      }
    }));
  };

  const openPlannerAssignmentModal = (recipe, source) => {
    setPlannerAssignmentTarget({
      source,
      recipe,
      day: WEEK_DAYS[0],
      slot: recipe?.mealType && MEAL_TYPES.includes(recipe.mealType.charAt(0).toUpperCase() + recipe.mealType.slice(1))
        ? recipe.mealType.charAt(0).toUpperCase() + recipe.mealType.slice(1)
        : mealType
    });
  };

  const assignTargetRecipeToPlanner = async () => {
    if (!plannerAssignmentTarget) return;

    let recipeId = plannerAssignmentTarget.recipe.id || null;

    if (!recipeId) {
      const existingSavedRecipe = getSavedGeneratedRecipe(plannerAssignmentTarget.recipe);
      if (existingSavedRecipe) {
        recipeId = existingSavedRecipe.id;
      } else {
        recipeId = await saveRecipe(buildSavedRecipePayload(plannerAssignmentTarget.recipe, mealType));
      }
    }

    if (!recipeId) {
      setError('Unable to add recipe to weekly planner.');
      return;
    }

    appendRecipeToPlannerSlot(plannerAssignmentTarget.day, plannerAssignmentTarget.slot, recipeId);
    setPlannerAssignmentTarget(null);
  };

  const getPlannerSlotRecipeIds = (day, slot) => weeklyPlanner[day][slot].filter(Boolean);
  const getPlannerSlotRecipes = (day, slot) => getPlannerSlotRecipeIds(day, slot).map((recipeId) => getRecipeById(recipeId)).filter(Boolean);
  const getAllPlannedRecipes = (selectedDays = WEEK_DAYS) => (
    selectedDays.flatMap((day) => MEAL_TYPES.flatMap((slot) => getPlannerSlotRecipes(day, slot)))
  );

  const buildWeeklyPlanShareText = () => (
    [
      'Daily Wok Weekly Plan',
      ...WEEK_DAYS.flatMap((day) => [
        '',
        day,
        ...MEAL_TYPES.map((slot) => {
          const recipesForSlot = getPlannerSlotRecipes(day, slot).filter(Boolean);
          return `${slot}: ${recipesForSlot.length > 0 ? recipesForSlot.map((recipe) => getDisplayRecipeTitle(recipe)).join(' | ') : 'Unassigned'}`;
        })
      ])
    ].join('\n')
  );

  const buildWeeklyGroceryItems = (selectedDays = WEEK_DAYS) => {
    const ingredientCounts = new Map();

    getAllPlannedRecipes(selectedDays).forEach((recipe) => {
      recipe.ingredients?.forEach((ingredient) => {
        const normalizedIngredient = normalizeGroceryIngredient(ingredient);
        if (!normalizedIngredient) return;

        const key = normalizedIngredient.key;
        const existing = ingredientCounts.get(key);

        if (existing) {
          existing.count += 1;
        } else {
          ingredientCounts.set(key, { label: normalizedIngredient.label, count: 1, isSeasoning: normalizedIngredient.isSeasoning });
        }
      });
    });

    return Array.from(ingredientCounts.entries())
      .map(([key, value]) => ({
        id: key,
        label: value.label,
        checked: false,
        count: value.count,
        isSeasoning: value.isSeasoning
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(({ count, isSeasoning, ...item }) => ({
        ...item,
        label: isSeasoning ? item.label : `${item.label}${count > 1 ? ` x${count}` : ''}`
      }));
  };

  const mergeGroceryItemsWithExistingState = (labels) => {
    const previousItemsById = new Map((groceryList.items || []).map((item) => [item.id, item]));
    const uniqueItems = new Map();

    labels.forEach((label) => {
      const normalizedIngredient = normalizeGroceryIngredient(label);
      if (!normalizedIngredient) return;

      const existing = uniqueItems.get(normalizedIngredient.key);
      if (existing) return;

      uniqueItems.set(normalizedIngredient.key, {
        id: normalizedIngredient.key,
        label: normalizedIngredient.label,
        checked: previousItemsById.get(normalizedIngredient.key)?.checked || false
      });
    });

    return Array.from(uniqueItems.values()).sort((a, b) => a.label.localeCompare(b.label));
  };

  const buildGroceryListShareText = () => {
    const groceryItems = groceryList.items || [];

    return [
      'Daily Wok Grocery List',
      `Generated: ${formatTimestamp(groceryList.generatedAt)}`,
      '',
      ...(groceryItems.length > 0 ? groceryItems.map((item) => `- ${item.label}`) : ['- No planned dishes yet'])
    ].join('\n');
  };

  const shareWeeklyPlan = async () => {
    const shareText = buildWeeklyPlanShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Daily Wok Weekly Plan',
          text: shareText
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setError('Weekly plan copied to clipboard.');
        return;
      }

      setError('Sharing is not available on this device.');
    } catch {
      setError('Unable to share weekly plan.');
    }
  };

  const openWeeklyGroceryPlannerModal = () => {
    setGroceryPlannerDaysTarget({
      selectedDays: [...WEEK_DAYS]
    });
  };

  const toggleGroceryPlannerDay = (day) => {
    setGroceryPlannerDaysTarget((current) => {
      if (!current) return current;
      const nextSelectedDays = current.selectedDays.includes(day)
        ? current.selectedDays.filter((selectedDay) => selectedDay !== day)
        : [...current.selectedDays, day];

      return {
        ...current,
        selectedDays: nextSelectedDays
      };
    });
  };

  const generateWeeklyGroceryList = async (selectedDays = WEEK_DAYS) => {
    const plannedRecipes = getAllPlannedRecipes(selectedDays);

    if (plannedRecipes.length === 0) {
      await setDoc(doc(db, 'planner', 'groceryList'), {
        generatedAt: serverTimestamp(),
        items: []
      }, { merge: true });
      setCurrentView('grocery');
      setGroceryPlannerDaysTarget(null);
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = 'gemini-3.1-flash-lite-preview';

    if (!apiKey) {
      setError('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      return;
    }

    const prompt = [
      'ROLE',
      'You are a practical grocery consolidation assistant.',
      '',
      buildPromptSection('TASK', [
        'Consolidate the weekly meal plan into one sensible grocery shopping list.',
        'Merge duplicate ingredients across recipes.',
        'Generate the list for a household helper doing realistic grocery shopping.',
        'Output items in realistic grocery purchase units, not recipe units.',
        'Do not use tsp, tbsp, or ml for basic grocery items.',
        'Convert very small recipe quantities into practical buying units where appropriate.',
        'Example: "1 tbsp milk" should become "1 carton milk".',
        'Example: "2 cloves garlic" should become "1 bulb garlic".',
        'Exclude pantry staples unless a large quantity is clearly required.',
        'Exclude water, salt, sugar, oil, soy sauce, and basic seasonings unless they are needed in unusually large quantity.',
        'Combine duplicate ingredients into one realistic final quantity.',
        'Example: "100g pork" plus "200g pork" should become "300g pork".',
        'Prefer common supermarket packaging and purchase sizes.',
        'Example: eggs should be grouped into realistic purchase counts such as 6 eggs or 12 eggs.',
        'Example: milk should be grouped as 1 carton when appropriate.',
        'Example: vegetables should usually be expressed as whole units or roughly 300g to 500g where appropriate.',
        'Do not include recipe titles or explanations.',
        'Return only grocery item labels that should appear in the final list.'
      ]),
      '',
      buildPromptSection('WEEKLY RECIPES', plannedRecipes.map((recipe, index) => (
        `RECIPE ${index + 1}: ${getDisplayRecipeTitle(recipe)} | INGREDIENTS: ${recipe.ingredients?.join(', ') || 'None'}`
      ))),
      '',
      buildPromptSection('OUTPUT REQUIREMENTS', [
        'Return a JSON array of strings.',
        'Each string must be one grocery line item only.',
        'No markdown, no numbering, no extra commentary.'
      ])
    ].join('\n');

    setLastGeminiPrompt(prompt);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          }
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) throw new Error(`API call failed with status ${response.status}`);

      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error('API returned no grocery payload');

      const parsedItems = JSON.parse(resultText);
      const groceryLabels = Array.isArray(parsedItems) ? parsedItems.filter((item) => typeof item === 'string') : [];
      const mergedItems = mergeGroceryItemsWithExistingState(groceryLabels);

      await setDoc(doc(db, 'planner', 'groceryList'), {
        generatedAt: serverTimestamp(),
        items: mergedItems
      }, { merge: true });
      setCurrentView('grocery');
      setGroceryPlannerDaysTarget(null);
    } catch {
      const fallbackItems = mergeGroceryItemsWithExistingState(buildWeeklyGroceryItems(selectedDays).map((item) => item.label));
      await setDoc(doc(db, 'planner', 'groceryList'), {
        generatedAt: serverTimestamp(),
        items: fallbackItems
      }, { merge: true });
      setError('Gemini grocery consolidation failed. A basic grocery list was generated instead.');
      setCurrentView('grocery');
      setGroceryPlannerDaysTarget(null);
      return;
    }

    setGroceryPlannerDaysTarget(null);
  };

  const shareGroceryList = async () => {
    const groceryListText = buildGroceryListShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Daily Wok Grocery List',
          text: groceryListText
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(groceryListText);
        setError('Grocery list copied to clipboard.');
        return;
      }

      setError('Sharing is not available on this device.');
    } catch {
      setError('Unable to share grocery list.');
    }
  };

  const clearWeeklyPlanner = async () => {
    const emptyPlanner = createEmptyWeeklyPlanner();
    await setDoc(doc(db, 'planner', 'weekly'), {
      plan: emptyPlanner,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setWeeklyPlanner(emptyPlanner);
  };

  const clearGroceryList = async () => {
    await setDoc(doc(db, 'planner', 'groceryList'), {
      generatedAt: serverTimestamp(),
      items: []
    }, { merge: true });
    setNewGroceryItem('');
  };

  const updateGroceryItems = async (items) => {
    await setDoc(doc(db, 'planner', 'groceryList'), {
      items
    }, { merge: true });
  };

  const toggleGroceryItem = async (itemId) => {
    await updateGroceryItems((groceryList.items || []).map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )));
  };

  const removeGroceryItem = async (itemId) => {
    await updateGroceryItems((groceryList.items || []).filter((item) => item.id !== itemId));
  };

  const addGroceryItem = async () => {
    const normalizedItem = normalizeGroceryIngredient(newGroceryItem);
    if (!normalizedItem) return;

    const existing = (groceryList.items || []).find((item) => item.id === normalizedItem.key);
    if (existing) {
      setNewGroceryItem('');
      return;
    }

    await updateGroceryItems([
      ...(groceryList.items || []),
      { id: normalizedItem.key, label: normalizedItem.label, checked: false }
    ]);
    setNewGroceryItem('');
  };

  const menuContent = (
    <div className={`min-w-0 ${compactGapClass}`}>
      <section className={sectionCardClass}>
        <div className={`${isMobileLayout ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
          <div className={`${isMobileLayout ? 'rounded-[8px] p-2' : 'rounded-[10px] p-2.5'} bg-[rgba(17,17,17,0.05)] text-[#111111]`}><LayoutGrid size={isMobileLayout ? 14 : 16} /></div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">Meal Profile</p>
            <h3 className={`${isMobileLayout ? 'text-[20px]' : 'text-[22px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>Meal Profile</h3>
          </div>
        </div>
        <div className={`grid ${isMobileLayout ? 'gap-4 grid-cols-1' : 'gap-6 grid-cols-3'}`}>
          <div className="space-y-3 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]"># Of Dishes</label>
              <span className="text-[24px] font-semibold text-[#111111]">{dishCount}</span>
            </div>
            <input type="range" min="1" max="6" step="1" value={dishCount} onChange={(e) => setDishCount(parseInt(e.target.value, 10))} className={trackClass} />
            <div className="flex justify-between text-[12px] text-[#6B7280]"><span>Light spread</span><span>Full table</span></div>
            <div className="border-t border-[#E5E7EB] pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Cuisine Style</label>
                <span className="rounded-full bg-[rgba(17,17,17,0.05)] px-3 py-1 text-[12px] font-medium text-[#111111]">{getStyleLabel(styleWeight)}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STYLE_OPTIONS.map((option) => {
                  const isSelected = styleWeight === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStyleWeight(option.value)}
                      className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-medium transition duration-200 ease-out ${
                        isSelected
                          ? 'border-[#111111] bg-white text-[#111111] shadow-[0_8px_20px_rgba(17,17,17,0.08)]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:bg-[#FCFCFD] hover:text-[#111111]'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isSelected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Diners</label>
                <div className="text-[24px] font-semibold text-[#111111]">{activeDinerCount}</div>
              </div>
              <div className="flex rounded-[10px] border border-[#E5E7EB] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setIsFamilyMode(false)}
                  className={`rounded-[8px] px-3 py-2 text-[11px] font-medium transition duration-200 ease-out ${!isFamilyMode ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFamilyMode(true);
                    if (selectedFamilyProfileIds.length === 0 && familyProfiles.length > 0) {
                      setSelectedFamilyProfileIds(familyProfiles.map((profile) => profile.id));
                    }
                  }}
                  className={`rounded-[8px] px-3 py-2 text-[11px] font-medium transition duration-200 ease-out ${isFamilyMode ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`}
                >
                  Family
                </button>
              </div>
            </div>
            {isFamilyMode ? (
              familyProfiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {familyProfiles.map((profile) => {
                    const iconOption = getFamilyProfileIcon(profile.icon);
                    const isSelected = selectedFamilyProfileIds.includes(profile.id);
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => toggleFamilyProfileSelection(profile.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border px-3 py-2.5 text-left transition duration-200 ease-out ${isSelected ? 'border-[#111111] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.08)]' : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'}`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="rounded-[8px] bg-[rgba(17,17,17,0.05)] p-1.5 text-[#111111]">
                            <FamilyIconGlyph option={iconOption} size={14} badgeSize={8} />
                          </span>
                          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px] font-medium text-[#111111]">{profile.name}</span>
                        </span>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isSelected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#D1D5DB] bg-white px-4 py-5 text-[13px] text-[#6B7280]">
                  No family profiles yet. Add them in the Family Profiles tab first.
                </div>
              )
            ) : (
              <>
                <input type="range" min="2" max="8" step="1" value={dinerCount} onChange={(e) => setDinerCount(parseInt(e.target.value, 10))} className={trackClass} />
                <div className="flex justify-between text-[12px] text-[#6B7280]"><span>Smaller meal</span><span>Group dinner</span></div>
              </>
            )}
          </div>
          <div className="space-y-3 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
            <div className="space-y-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Meal Type</label>
              <div className="grid grid-cols-1 gap-2">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium transition duration-200 ease-out ${
                      mealType === type ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-[#E5E7EB] pt-3">
              <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Supply Source</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className={selectClass}>
                {LOCATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>
      <div className={`grid ${isMobileLayout ? 'gap-3 grid-cols-1' : 'gap-5 grid-cols-2'}`}>
        <IngredientBlock title="Proteins" items={proteins} options={proteinDropdownOptions} type="protein" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} deleteIngredientOption={deleteIngredientOption} compact={isMobileLayout} />
        <IngredientBlock title="Veggies" items={fibers} options={fiberDropdownOptions} type="fiber" dot="bg-[#6B7280]" addIngredient={addIngredient} removeIngredient={removeIngredient} updateIngredient={updateIngredient} deleteIngredientOption={deleteIngredientOption} compact={isMobileLayout} />
      </div>
      <section className={sectionCardClass}>
        <div className={`${isMobileLayout ? 'mb-4' : 'mb-6'} flex items-center gap-3`}>
          <div className={`${isMobileLayout ? 'rounded-[8px] p-2' : 'rounded-[10px] p-2.5'} bg-[rgba(17,17,17,0.05)] text-[#111111]`}><Settings2 size={isMobileLayout ? 14 : 16} /></div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">Kitchen Settings</p>
            <h3 className={`${isMobileLayout ? 'text-[20px]' : 'text-[22px]'} font-semibold tracking-[-0.02em] text-[#111111]`}>Kitchen Settings</h3>
          </div>
        </div>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
          <button
            type="button"
            onClick={() => setIsKitchenSettingsExpanded((value) => !value)}
            className="flex w-full items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-left transition duration-200 ease-out hover:bg-white"
          >
            <span>
              <span className="block text-[14px] font-medium text-[#111111]">Additional Kitchen Settings</span>
              <span className="mt-1 block text-[12px] text-[#6B7280]">Flavor vs health, service mode, and preference notes</span>
            </span>
            <ChevronDown size={16} className={`text-[#6B7280] transition duration-200 ease-out ${isKitchenSettingsExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isKitchenSettingsExpanded ? (
            <div className="space-y-5 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[12px] font-medium text-[#6B7280]">Flavor vs Health</label>
                  <span className="rounded-full bg-[rgba(17,17,17,0.05)] px-3 py-1 text-[12px] font-medium text-[#111111]">{getFlavorHealthLabel(flavorHealthBalance)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={flavorHealthBalance}
                  onChange={(e) => setFlavorHealthBalance(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-[#111111]"
                />
                <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                  <span>Healthier / lighter</span>
                  <span>{flavorHealthBalance}</span>
                  <span>Richer / flavorful</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div><p className="text-[15px] font-medium text-[#111111]">Service Mode</p><p className="text-[13px] text-[#6B7280]">Switch toddler-safe guidance on or off.</p></div>
                <div className="flex items-center rounded-[10px] border border-[#E5E7EB] bg-white p-1">
                  <button onClick={() => setIsToddlerFriendly(false)} className={`rounded-lg px-4 py-2.5 text-[13px] font-medium transition duration-200 ease-out ${!isToddlerFriendly ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`}>Adults Only</button>
                  <button onClick={() => setIsToddlerFriendly(true)} className={`flex items-center rounded-lg px-4 py-2.5 text-[13px] font-medium transition duration-200 ease-out ${isToddlerFriendly ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`}><Baby size={12} className="mr-1.5" />Toddler</button>
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
            </div>
          ) : null}
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
              <div key={rule.id} className={`flex items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] ${isMobileLayout ? 'px-3 py-3' : 'px-4 py-4'}`}>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#111111]" />
                  <span className="text-[15px] font-medium text-[#111111]">{rule.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEditingRule(rule)} className={secondaryButtonClass}>Edit</button>
                  <button onClick={() => removeCustomRule(rule.id)} className="rounded-[8px] p-1.5 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"><XCircle size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );

  const familyProfilesContent = (
    <section className={`min-w-0 ${isMobileLayout ? 'space-y-3' : 'space-y-5'} pb-20 pt-2`}>
      <Section title="Family Profiles" icon={Users} compact={isMobileLayout}>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
          <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[#6B7280]">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grandma, Kai, Baby Emma..."
                  className={inputClass}
                  value={familyProfileName}
                  onChange={(e) => setFamilyProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveFamilyProfile()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[#6B7280]">Icon</label>
                <div className={`grid gap-2 ${isMobileLayout ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {FAMILY_ICON_OPTIONS.map((option) => {
                    const isSelected = familyProfileIcon === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFamilyProfileIcon(option.value)}
                        className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 text-left transition duration-200 ease-out ${
                          isSelected
                            ? 'border-[#111111] bg-white text-[#111111] shadow-[0_8px_20px_rgba(17,17,17,0.08)]'
                            : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#111111]'
                        }`}
                      >
                        <FamilyIconGlyph option={option} size={16} badgeSize={9} />
                        <span className="text-[13px] font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[#6B7280]">Dietary Requirements</label>
                <textarea
                  className="min-h-[112px] w-full rounded-[10px] border border-[#E5E7EB] bg-white p-4 text-[15px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)]"
                  placeholder="e.g. no spicy food, low sodium, toddler-safe textures..."
                  value={familyProfileDietary}
                  onChange={(e) => setFamilyProfileDietary(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={saveFamilyProfile} className={primaryButtonClass}>
                  {editingFamilyProfileId ? 'Save Profile' : 'Add Profile'}
                </button>
                {editingFamilyProfileId ? (
                  <button onClick={cancelEditingFamilyProfile} className={secondaryButtonClass}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {familyProfiles.map((profile) => {
              const profileIcon = getFamilyProfileIcon(profile.icon);
              return (
                <div key={profile.id} className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="rounded-[10px] bg-[rgba(17,17,17,0.05)] p-2.5 text-[#111111]">
                        <FamilyIconGlyph option={profileIcon} size={16} badgeSize={9} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words text-[16px] font-semibold text-[#111111]">{profile.name}</h3>
                        <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">{profileIcon.label}</p>
                        <p className="mt-3 break-words text-[14px] leading-relaxed text-[#6B7280]">
                          {profile.dietaryRequirements || 'No dietary requirements added.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => startEditingFamilyProfile(profile)} className={secondaryButtonClass}>Edit</button>
                      <button onClick={() => removeFamilyProfile(profile.id)} className="rounded-[8px] p-1.5 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {familyProfiles.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-white px-5 py-8 text-center text-[14px] text-[#6B7280]">
                No family profiles yet. Add one to store household dietary preferences.
              </div>
            ) : null}
          </div>
        </div>
      </Section>
    </section>
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
                      ? 'border-[#111111] bg-[#111111] text-white'
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
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280]'
              }`}
            >
              {showFavoritesOnly ? 'On' : 'Off'}
            </button>
          </div>

          <div className="grid gap-4">
            {filteredSavedRecipes.map((recipe) => (
              <div key={recipe.id} className="rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)] sm:px-5">
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
                  <h3 className="break-words text-[17px] font-semibold leading-snug text-[#111111]">{getDisplayRecipeTitle(recipe)}</h3>
                  <p className="mt-1 break-words text-[14px] capitalize text-[#6B7280]">{recipe.mealType}</p>
                </button>
                <div className="mt-3 flex justify-end">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => openRecipeTuneModal(recipe)}
                      className={secondaryButtonClass}
                    >
                      Fine Tune
                    </button>
                    <button
                      onClick={() => openPlannerAssignmentModal(recipe, 'saved')}
                      className={secondaryButtonClass}
                    >
                      Add to Weekly Planner
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredSavedRecipes.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-white px-5 py-8 text-center text-[14px] text-[#6B7280]">
                No saved recipes match the current filters.
              </div>
            )}
          </div>
        </div>
      </Section>
    </section>
  );

  const groceryListContent = (
    <section className={`min-w-0 ${isMobileLayout ? 'space-y-3' : 'space-y-5'} pb-20 pt-2`}>
      <Section title="Grocery List" icon={CheckSquare} compact={isMobileLayout}>
        <div className={isMobileLayout ? 'space-y-4' : 'space-y-5'}>
          <div className={`flex ${isMobileLayout ? 'flex-col items-stretch gap-3' : 'items-start justify-between gap-4'}`}>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Planner Export</p>
              <p className="mt-2 text-[14px] text-[#6B7280]">Generated from dishes allocated in the weekly planner.</p>
              <p className="mt-2 text-[13px] font-medium text-[#111111]">Generated: {formatTimestamp(groceryList.generatedAt)}</p>
            </div>
            <div className={`flex ${isMobileLayout ? 'flex-col gap-3' : 'items-center gap-3'}`}>
              <button onClick={generateWeeklyGroceryList} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Refresh From Planner
              </button>
              <button onClick={shareGroceryList} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Share
              </button>
              <button onClick={clearGroceryList} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Clear All
              </button>
            </div>
          </div>

          <div className={`flex ${isMobileLayout ? 'flex-col gap-3' : 'items-center gap-3'}`}>
            <input
              type="text"
              value={newGroceryItem}
              onChange={(e) => setNewGroceryItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addGroceryItem();
                }
              }}
              placeholder="Add extra grocery item..."
              className={inputClass}
            />
            <button onClick={addGroceryItem} className={`${isMobileLayout ? 'w-full' : ''} ${primaryButtonClass}`}>
              Add Item
            </button>
          </div>

          <div className="grid gap-3">
            {(groceryList.items || []).map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
                <button
                  onClick={() => toggleGroceryItem(item.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[8px] border transition ${item.checked ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#D1D5DB] bg-white text-transparent'}`}
                  aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.label}`}
                >
                  <CheckSquare size={12} />
                </button>
                <span className={`min-w-0 flex-1 break-words text-[15px] ${item.checked ? 'text-[#9CA3AF] line-through' : 'text-[#111111]'}`}>{item.label}</span>
                <button
                  onClick={() => removeGroceryItem(item.id)}
                  className="shrink-0 rounded-[8px] p-1.5 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"
                  aria-label={`Remove ${item.label}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(groceryList.items || []).length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-white px-5 py-8 text-center text-[14px] text-[#6B7280]">
                No grocery list yet. Generate one from the weekly planner.
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
          <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA]">
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-[13px] leading-relaxed text-[#111111]">
              {lastGeminiPrompt || 'No Gemini prompt has been sent yet.'}
            </pre>
          </div>
        </div>
      </Section>
    </section>
  );

  const weeklyPlannerContent = (
    <section className={`min-w-0 ${isMobileLayout ? 'space-y-3' : 'space-y-5'} pb-20 pt-2`}>
      <Section title="Weekly Planner" icon={Clock} compact={isMobileLayout}>
        <div className={isMobileLayout ? 'space-y-3' : 'space-y-4'}>
          <div className={`flex ${isMobileLayout ? 'flex-col items-stretch gap-3' : 'items-start justify-between gap-4'}`}>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Calendar View</p>
              <p className="mt-2 text-[14px] text-[#6B7280]">
                Assign saved recipes to breakfast, lunch, and dinner slots for each day.
              </p>
            </div>
            <div className={`flex ${isMobileLayout ? 'flex-col gap-3' : 'items-center gap-3'}`}>
              <button onClick={openWeeklyGroceryPlannerModal} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Grocery List
              </button>
              <button onClick={shareWeeklyPlan} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Share Plan
              </button>
              <button onClick={clearWeeklyPlanner} className={`${isMobileLayout ? 'w-full' : ''} ${secondaryButtonClass}`}>
                Clear All
              </button>
            </div>
          </div>
          {isMobileLayout ? (
            <div className="grid gap-3 grid-cols-1">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="min-w-0 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.05)]">
                  <div className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Day Plan</p>
                    <h4 className="mt-1 text-[16px] font-semibold text-[#111111]">{day}</h4>
                  </div>
                  <div className="space-y-3 p-4">
                    {MEAL_TYPES.map((slot) => {
                      const assignedRecipes = getPlannerSlotRecipes(day, slot).filter(Boolean);

                      return (
                        <div key={`${day}-${slot}`} className={`min-w-0 overflow-hidden rounded-[12px] border p-3 transition duration-200 ease-out ${assignedRecipes.length > 0 ? 'border-[rgba(17,17,17,0.10)] bg-[rgba(17,17,17,0.03)] shadow-[0_8px_20px_rgba(17,17,17,0.05)]' : 'border-[#E5E7EB] bg-[#F7F8FA]'}`}>
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">{slot}</label>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${assignedRecipes.length > 0 ? 'bg-[#111111] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>
                                {assignedRecipes.length > 0 ? `${assignedRecipes.length} dish${assignedRecipes.length > 1 ? 'es' : ''}` : 'Open'}
                              </span>
                              <button
                                onClick={() => addDishToPlannerSlot(day, slot)}
                                className="flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937]"
                                aria-label={`Add dish to ${day} ${slot}`}
                              >
                                + Dish
                              </button>
                            </div>
                          </div>
                          <div className="min-w-0 space-y-3">
                            {assignedRecipes.length > 0 ? assignedRecipes.map((recipe, dishIndex) => (
                              <button
                                key={`${day}-${slot}-${dishIndex}`}
                                onClick={() => openPlannerRecipePicker(day, slot, dishIndex)}
                                className="flex w-full min-w-0 items-start justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3 text-left transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:shadow-[0_8px_20px_rgba(17,17,17,0.06)]"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-semibold leading-snug text-[#111111] break-words [overflow-wrap:anywhere]">{getDisplayRecipeTitle(recipe)}</p>
                                  <div className="mt-1 flex min-w-0 flex-wrap gap-2 text-[11px] text-[#6B7280]">
                                    <span className="min-w-0 max-w-full rounded-full bg-[#F7F8FA] px-2 py-0.5 capitalize break-words [overflow-wrap:anywhere]">{recipe.mealType}</span>
                                    {recipe.isFavorite ? <span className="whitespace-nowrap rounded-full bg-[rgba(17,17,17,0.06)] px-2 py-0.5 text-[#111111]">Favorite</span> : null}
                                  </div>
                                </div>
                                <span className="shrink-0 text-[11px] font-medium text-[#6B7280]">Edit</span>
                              </button>
                            )) : (
                              <button
                                onClick={() => addDishToPlannerSlot(day, slot)}
                                className="flex min-h-[96px] w-full items-center justify-center rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F7F8FA] px-4 py-5 text-center transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:bg-[rgba(17,17,17,0.03)]"
                              >
                                <span className="text-[36px] font-light leading-none text-[#111111]">+</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.05)]">
              <div className="min-w-[1700px] max-w-none">
                <div className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  <div className="border-r border-[#E5E7EB] px-4 py-4" />
                  {WEEK_DAYS.map((day) => (
                    <div key={day} className="min-w-0 overflow-hidden border-r border-[#E5E7EB] px-4 py-4 last:border-r-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Day</p>
                      <h4 className="mt-1 break-words text-[16px] font-semibold text-[#111111] [overflow-wrap:anywhere]">{day}</h4>
                    </div>
                  ))}
                </div>
                {MEAL_TYPES.map((slot, rowIndex) => (
                  <div key={slot} className={`grid grid-cols-[140px_repeat(7,minmax(0,1fr))] ${rowIndex !== MEAL_TYPES.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                    <div className="min-w-0 overflow-hidden border-r border-[#E5E7EB] bg-[#F7F8FA] px-4 py-5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Meal Slot</p>
                      <h5 className="mt-1 break-words text-[15px] font-semibold text-[#111111] [overflow-wrap:anywhere]">{slot}</h5>
                    </div>
                    {WEEK_DAYS.map((day) => {
                      const assignedRecipes = getPlannerSlotRecipes(day, slot).filter(Boolean);
                      return (
                        <div key={`${day}-${slot}`} className="min-w-0 overflow-hidden border-r border-[#E5E7EB] p-4 last:border-r-0">
                          <div className={`flex h-full min-w-0 flex-col overflow-hidden rounded-[12px] border p-3 transition duration-200 ease-out ${assignedRecipes.length > 0 ? 'border-[rgba(17,17,17,0.10)] bg-[rgba(17,17,17,0.03)] shadow-[0_8px_20px_rgba(17,17,17,0.05)]' : 'border-[#E5E7EB] bg-[#FBFBFC]'}`}>
                            <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
                              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${assignedRecipes.length > 0 ? 'bg-[#111111] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>
                                {assignedRecipes.length > 0 ? `${assignedRecipes.length} dish${assignedRecipes.length > 1 ? 'es' : ''}` : 'Open'}
                              </span>
                              <button
                                onClick={() => addDishToPlannerSlot(day, slot)}
                                className="flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937]"
                                aria-label={`Add dish to ${day} ${slot}`}
                              >
                                + Dish
                              </button>
                            </div>
                            <div className="min-w-0 space-y-3">
                              {assignedRecipes.length > 0 ? assignedRecipes.map((recipe, dishIndex) => (
                                <button
                                  key={`${day}-${slot}-${dishIndex}`}
                                  onClick={() => openPlannerRecipePicker(day, slot, dishIndex)}
                                  className="flex w-full min-w-0 items-start justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3 text-left transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:shadow-[0_8px_20px_rgba(17,17,17,0.06)]"
                                >
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p className="text-[13px] font-semibold leading-snug text-[#111111] break-words [overflow-wrap:anywhere]">{getDisplayRecipeTitle(recipe)}</p>
                                    <div className="flex min-w-0 flex-wrap gap-2 text-[11px] text-[#6B7280]">
                                      <span className="min-w-0 max-w-full rounded-full bg-[#F7F8FA] px-2 py-0.5 capitalize break-words [overflow-wrap:anywhere]">{recipe.mealType}</span>
                                      {recipe.styleTag ? <span className="min-w-0 max-w-full rounded-full bg-[#F7F8FA] px-2 py-0.5 break-words [overflow-wrap:anywhere]">{recipe.styleTag}</span> : null}
                                      {recipe.isFavorite ? <span className="whitespace-nowrap rounded-full bg-[rgba(17,17,17,0.06)] px-2 py-0.5 text-[#111111]">Favorite</span> : null}
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-[11px] font-medium text-[#6B7280]">Edit</span>
                                </button>
                              )) : (
                                <button
                                  onClick={() => addDishToPlannerSlot(day, slot)}
                                  className="flex min-h-[112px] w-full items-center justify-center rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F7F8FA] px-4 py-5 text-center transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:bg-[rgba(17,17,17,0.03)]"
                                >
                                  <span className="text-[42px] font-light leading-none text-[#111111]">+</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
    </section>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA] pb-24 text-[#111111]">
      <header className={`sticky top-0 z-30 border-b border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.72)] px-4 backdrop-blur-xl shadow-[0_8px_32px_rgba(17,17,17,0.06)] ${isMobileLayout ? 'py-3' : 'py-4'}`}>
        <div className="mx-auto w-full max-w-[1160px] min-w-0">
          <div className={`flex min-w-0 ${isMobileLayout ? 'items-start justify-between gap-3' : 'items-center justify-between gap-6'}`}>
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => setIsNavOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.68)] text-[#6B7280] backdrop-blur-xl shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.08)] hover:text-[#111111]"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <div className={`rounded-[12px] border border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.68)] text-[#111111] backdrop-blur-xl shadow-[0_8px_24px_rgba(17,17,17,0.06)] ${isMobileLayout ? 'p-2.5' : 'p-3'}`}><ChefHat size={isMobileLayout ? 22 : 28} /></div>
              <div className="min-w-0"><h1 className={`break-words font-bold tracking-[-0.04em] text-[#111111] ${isMobileLayout ? 'text-[24px]' : 'text-[32px]'}`}>Daily Wok</h1></div>
            </div>
            <div className={`flex min-w-0 ${isMobileLayout ? 'justify-end' : 'flex-wrap items-center justify-end'} gap-3`}>
              <div className={`flex rounded-[10px] border border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.68)] p-1 backdrop-blur-xl shadow-[0_8px_24px_rgba(17,17,17,0.06)] ${isMobileLayout ? 'scale-90 origin-top-right' : ''}`}>
                <button onClick={() => setLayoutMode('mobile')} className={`inline-flex items-center rounded-[8px] px-3 py-2 text-[11px] font-medium transition duration-200 ease-out ${isMobileLayout ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`} aria-label="Portrait layout"><Smartphone size={12} /></button>
                <button onClick={() => setLayoutMode('desktop')} className={`inline-flex items-center rounded-[8px] px-3 py-2 text-[11px] font-medium transition duration-200 ease-out ${!isMobileLayout ? 'bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]' : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'}`} aria-label="Desktop layout"><Monitor size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isNavOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(17,17,17,0.35)]" onClick={() => setIsNavOpen(false)}>
          <aside
            className="h-full w-[min(18rem,82vw)] border-r border-[rgba(255,255,255,0.75)] bg-[rgba(255,255,255,0.74)] px-4 py-5 backdrop-blur-2xl shadow-[0_16px_40px_rgba(17,17,17,0.10)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Navigate</p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#111111]">Daily Wok</h2>
              </div>
              <button
                onClick={() => setIsNavOpen(false)}
                className="rounded-[8px] p-2 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"
                aria-label="Close navigation menu"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { id: 'main', label: 'Main Page', icon: LayoutGrid },
                { id: 'family', label: 'Family Profiles', icon: Users },
                { id: 'weekly', label: 'Weekly Planner', icon: Clock },
                { id: 'grocery', label: 'Grocery List', icon: CheckSquare },
                { id: 'saved', label: 'Saved Recipes', icon: Star },
                { id: 'rules', label: 'Dietary Rules', icon: ShieldCheck },
                { id: 'developer', label: 'Developer', icon: Menu }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setCurrentView(id);
                    setIsNavOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-[14px] font-medium transition duration-200 ease-out ${
                    currentView === id
                      ? 'bg-[rgba(17,17,17,0.06)] text-[#111111]'
                      : 'text-[#6B7280] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'
                  }`}
                >
                  {React.createElement(icon, { size: 16 })}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className={`mx-auto w-full min-w-0 px-4 ${isMobileLayout ? 'max-w-md pt-5' : 'max-w-[1160px] pt-8'}`}>
        {currentView === 'main' ? (
          <>
            <div className="min-w-0">{menuContent}</div>

            <div className={`${isMobileLayout ? 'mt-5' : 'mt-8'} flex justify-center`}>
              <button onClick={() => generateRecipes(false)} disabled={loading} className={`flex w-full max-w-[1160px] items-center justify-center gap-3 rounded-[12px] bg-[#111111] font-semibold text-white shadow-[0_12px_32px_rgba(17,17,17,0.18)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#D1D5DB] disabled:shadow-none ${isMobileLayout ? 'px-5 py-4 text-[14px]' : 'px-6 py-4 text-[15px]'}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>{loading ? 'Generating menu...' : 'Construct Menu'}</span>
              </button>
            </div>
            {error && <div className="mt-4 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-medium text-[#6B7280] shadow-[0_4px_16px_rgba(17,17,17,0.05)]">{error}</div>}

            {generatedRecipes.length > 0 && (
              <section className={`${isMobileLayout ? 'pb-16 pt-6' : 'pb-20 pt-10'}`}>
                <div className={`${isMobileLayout ? 'mb-5' : 'mb-8'} flex flex-wrap items-end justify-between gap-4`}><div className="min-w-0"><p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">AI Generated</p><h2 className={`mt-2 break-words font-semibold tracking-[-0.04em] text-[#111111] ${isMobileLayout ? 'text-[24px]' : 'text-[32px]'}`}>Executive Menu</h2></div><div className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[12px] font-medium text-[#6B7280] shadow-[0_4px_16px_rgba(17,17,17,0.05)]">{isMobileLayout ? 'Portrait Layout' : 'Desktop Layout'}</div></div>
                <div className={isMobileLayout ? 'space-y-4' : 'space-y-8'}>
                  {generatedRecipes.map((recipe, index) => (
                    <article key={index} className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.05)] transition duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
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
                                ? 'text-[#111111]'
                                : 'text-[#9CA3AF] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]'
                            } ${isMobileLayout ? 'mr-0 mt-0' : 'mr-8 mt-8'}`}
                            aria-label={getSavedGeneratedRecipe(recipe)?.isFavorite ? 'Saved as favorite' : 'Save recipe as favorite'}
                          >
                            <Star size={20} fill={getSavedGeneratedRecipe(recipe)?.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#F7F8FA] px-3 py-1 text-[11px] font-medium text-[#6B7280]">{recipe.styleTag}</span>
                            <span className="rounded-full bg-[rgba(17,17,17,0.06)] px-3 py-1 text-[11px] font-medium text-[#111111]">Balanced</span>
                          </div>
                          <h3 className={`${isMobileLayout ? 'text-[20px]' : 'text-[30px]'} font-semibold leading-tight text-[#111111]`}>{getDisplayRecipeTitle(recipe)}</h3>
                          <p className={`text-[15px] leading-relaxed text-[#6B7280] ${isMobileLayout ? 'mt-3' : 'mt-4'}`}>{recipe.description}</p>
                          <div className={`${isMobileLayout ? 'mt-3' : 'mt-5'} flex flex-wrap gap-2`}>
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Clock size={12} className="mr-2 text-[#111111]" />{recipe.prepTime}</div>
                            <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]"><Flame size={12} className="mr-2 text-[#111111]" />{recipe.cookTime}</div>
                            {getNutritionSummary(recipe).map((item) => (
                              <div key={item} className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                                {item}
                              </div>
                            ))}
                          </div>
                          <div className={`${isMobileLayout ? 'mt-3' : 'mt-5'} flex`}>
                            <button
                              onClick={() => openPlannerAssignmentModal(recipe, 'generated')}
                              className={secondaryButtonClass}
                            >
                              Add to Weekly Planner
                            </button>
                          </div>
                        </div>
                        <div className={isMobileLayout ? 'min-w-0 space-y-5 px-4 py-4' : 'min-w-0 p-8 lg:w-[70%]'}>
                          <div className={`grid min-w-0 ${isMobileLayout ? 'gap-5 grid-cols-1' : 'gap-8 lg:grid-cols-3 lg:gap-8'}`}>
                            <div><h4 className="mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Ingredients</h4><ul className="space-y-3 text-[15px] text-[#111111]">{recipe.ingredients.map((ingredient, itemIndex) => <li key={itemIndex} className="flex items-start"><span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#111111]" />{ingredient}</li>)}</ul></div>
                            <div><h4 className="mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Execution</h4><ol className="space-y-4 text-[15px]">{recipe.instructions.map((step, stepIndex) => <li key={stepIndex} className="flex gap-3"><span className="pt-0.5 text-[13px] font-semibold text-[#111111]">{stepIndex + 1}.</span><span className="leading-relaxed text-[#6B7280]">{step}</span></li>)}</ol></div>
                            <div><h4 className="mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Cooking Tips</h4><ul className="space-y-3 text-[15px]">{recipe.cookingTips?.map((tip, tipIndex) => <li key={tipIndex} className="rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 leading-relaxed text-[#6B7280]">{tip}</li>)}</ul></div>
                          </div>
                        </div>
                      </div>
                      {isToddlerFriendly && recipe.toddlerAdaptation && <div className={`${isMobileLayout ? 'px-4 py-4' : 'flex items-start gap-4 p-8'} border-t border-[#E5E7EB] bg-[rgba(17,17,17,0.03)]`}><div className={`${isMobileLayout ? 'mb-2 flex items-center gap-2' : 'rounded-[10px] bg-[rgba(17,17,17,0.06)] p-3 text-[#111111]'} text-[12px] font-medium`}>{isMobileLayout ? <><Baby size={14} />Toddler Adaptation</> : <Baby size={20} />}</div><div><h5 className={`${isMobileLayout ? 'sr-only' : 'mb-1'} text-[12px] font-medium text-[#111111]`}>{isMobileLayout ? 'Toddler Adaptation' : 'Toddler Adaptation Advice'}</h5><p className="text-[15px] leading-relaxed text-[#6B7280]">{recipe.toddlerAdaptation}</p></div></div>}
                    </article>
                  ))}
                </div>

                <div className={`overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.05)] ${isMobileLayout ? 'mt-5 p-4' : 'mt-10 p-8'}`}>
                  <div className="mb-3 flex items-center gap-3 text-[12px] font-medium text-[#111111]"><Undo2 size={16} /><span>Refinement</span></div>
                  <h3 className="text-[22px] font-semibold text-[#111111]">Refine specific dishes?</h3>
              <div className={`mt-5 flex min-w-0 gap-4 ${isMobileLayout ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                    <textarea className="min-h-[112px] flex-1 rounded-[10px] border border-[#E5E7EB] bg-white p-5 text-[15px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)]" placeholder="e.g. Swap salmon for sea bass..." value={followUpComment} onChange={(e) => setFollowUpComment(e.target.value)} />
                    <button onClick={() => generateRecipes(true)} disabled={loading || !followUpComment.trim()} className="flex items-center justify-center gap-3 rounded-[10px] bg-[#111111] px-10 py-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.18)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937] active:scale-[0.98] disabled:opacity-40"><RefreshCcw size={18} />Update</button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : currentView === 'saved' ? (
          savedRecipesContent
        ) : currentView === 'weekly' ? (
          weeklyPlannerContent
        ) : currentView === 'grocery' ? (
          groceryListContent
        ) : currentView === 'family' ? (
          familyProfilesContent
        ) : currentView === 'rules' ? (
          rulesContent
        ) : (
          developerContent
        )}
      </main>

      {plannerPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setPlannerPickerTarget(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Select Dish</p>
              <h3 className="mt-1 text-[20px] font-semibold text-[#111111]">{plannerPickerTarget.day} · {plannerPickerTarget.slot}</h3>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
              {recipes.length > 0 ? recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => {
                    assignRecipeToPlannerSlot(plannerPickerTarget.day, plannerPickerTarget.slot, plannerPickerTarget.dishIndex, recipe.id);
                    setPlannerPickerTarget(null);
                  }}
                  className="flex w-full min-w-0 items-start justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-left transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[rgba(17,17,17,0.10)] hover:bg-white hover:shadow-[0_8px_20px_rgba(17,17,17,0.06)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-[#111111] break-words [overflow-wrap:anywhere]">{getDisplayRecipeTitle(recipe)}</p>
                    <div className="mt-1 flex min-w-0 flex-wrap gap-2 text-[11px] text-[#6B7280]">
                      <span className="rounded-full bg-white px-2 py-0.5 capitalize">{recipe.mealType}</span>
                      {recipe.styleTag ? <span className="min-w-0 max-w-full rounded-full bg-white px-2 py-0.5 break-words [overflow-wrap:anywhere]">{recipe.styleTag}</span> : null}
                      {recipe.isFavorite ? <span className="rounded-full bg-[rgba(17,17,17,0.06)] px-2 py-0.5 text-[#111111]">Favorite</span> : null}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[rgba(17,17,17,0.06)] px-3 py-1 text-[11px] font-medium text-[#111111]">Select</span>
                </button>
              )) : (
                <div className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F7F8FA] px-4 py-6 text-center text-[14px] leading-relaxed text-[#6B7280]">
                  No saved recipes yet. Save a recipe first, then assign it here.
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
              <button
                onClick={() => setPlannerPickerTarget(null)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              {getPlannerSlotRecipeIds(plannerPickerTarget.day, plannerPickerTarget.slot)[plannerPickerTarget.dishIndex] ? (
                <button
                  onClick={() => {
                    removeRecipeFromPlannerSlot(plannerPickerTarget.day, plannerPickerTarget.slot, plannerPickerTarget.dishIndex);
                    setPlannerPickerTarget(null);
                  }}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[#F7F8FA] hover:text-[#111111]"
                >
                  Remove Dish
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {plannerAssignmentTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setPlannerAssignmentTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Add To Weekly Planner</p>
              <h3 className="mt-1 text-[20px] font-semibold text-[#111111]">{getDisplayRecipeTitle(plannerAssignmentTarget.recipe)}</h3>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[#6B7280]">Day</label>
                <select
                  className={selectClass}
                  value={plannerAssignmentTarget.day}
                  onChange={(e) => setPlannerAssignmentTarget((current) => ({ ...current, day: e.target.value }))}
                >
                  {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[#6B7280]">Meal</label>
                <select
                  className={selectClass}
                  value={plannerAssignmentTarget.slot}
                  onChange={(e) => setPlannerAssignmentTarget((current) => ({ ...current, slot: e.target.value }))}
                >
                  {MEAL_TYPES.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
              <button onClick={() => setPlannerAssignmentTarget(null)} className={secondaryButtonClass}>Cancel</button>
              <button onClick={assignTargetRecipeToPlanner} className={primaryButtonClass}>Add</button>
            </div>
          </div>
        </div>
      )}

      {groceryPlannerDaysTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setGroceryPlannerDaysTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Generate Grocery List</p>
              <h3 className="mt-1 text-[20px] font-semibold text-[#111111]">Select Weekdays</h3>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="text-[14px] text-[#6B7280]">Only dishes planned on the selected days will be used for the grocery list.</p>
              <div className="grid grid-cols-2 gap-3">
                {WEEK_DAYS.map((day) => {
                  const isSelected = groceryPlannerDaysTarget.selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleGroceryPlannerDay(day)}
                      className={`rounded-xl border px-4 py-3 text-left text-[14px] font-medium transition ${
                        isSelected
                          ? 'border-[#111111] bg-[rgba(17,17,17,0.06)] text-[#111111]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>{day}</span>
                        {isSelected ? <span className="text-[15px] font-semibold text-[#111111]">✓</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
              <button onClick={() => setGroceryPlannerDaysTarget(null)} className={secondaryButtonClass}>Cancel</button>
              <button
                onClick={() => generateWeeklyGroceryList(groceryPlannerDaysTarget.selectedDays)}
                className={primaryButtonClass}
                disabled={groceryPlannerDaysTarget.selectedDays.length === 0}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {recipeTuneTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.4)] p-4 sm:items-center" onClick={() => {
          setRecipeTuneTarget(null);
          setRecipeTuneDraft(null);
        }}>
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">Fine Tune Recipe</p>
              <h3 className="mt-1 break-words text-[20px] font-semibold text-[#111111]">{getDisplayRecipeTitle(recipeTuneTarget)}</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-[#6B7280]">Modification Request</label>
                  <textarea
                    className="min-h-[112px] w-full rounded-[10px] border border-[#E5E7EB] bg-white p-4 text-[15px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)]"
                    placeholder="e.g. make this less oily, swap pork for chicken, shorten cooking time..."
                    value={recipeTunePrompt}
                    onChange={(e) => setRecipeTunePrompt(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={requestRecipeTune}
                    disabled={recipeTuneLoading || !recipeTunePrompt.trim()}
                    className={primaryButtonClass}
                  >
                    {recipeTuneLoading ? 'Generating Draft...' : 'Generate Draft'}
                  </button>
                </div>

                {recipeTuneDraft && (
                  <div className="space-y-4 rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Draft Preview</p>
                      <h4 className="mt-2 break-words text-[22px] font-semibold text-[#111111]">{getDisplayRecipeTitle(recipeTuneDraft)}</h4>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">{recipeTuneDraft.description}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h5 className="mb-2 text-[13px] font-medium text-[#6B7280]">Ingredients</h5>
                        <ul className="space-y-2 text-[14px] text-[#111111]">
                          {recipeTuneDraft.ingredients?.map((ingredient, index) => (
                            <li key={index} className="flex items-start"><span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6B7280]" />{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="mb-2 text-[13px] font-medium text-[#6B7280]">Instructions</h5>
                        <ol className="space-y-2 text-[14px] text-[#111111]">
                          {recipeTuneDraft.instructions?.map((step, index) => (
                            <li key={index} className="flex gap-2"><span className="font-semibold text-[#111111]">{index + 1}.</span><span>{step}</span></li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    {recipeTuneDraft.cookingTips?.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-[13px] font-medium text-[#6B7280]">Cooking Tips</h5>
                        <div className="grid gap-2">
                          {recipeTuneDraft.cookingTips.map((tip, index) => (
                            <div key={index} className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#6B7280]">{tip}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
              <button
                onClick={() => {
                  setRecipeTuneTarget(null);
                  setRecipeTuneDraft(null);
                  setRecipeTunePrompt('');
                }}
                className={secondaryButtonClass}
              >
                Discard Change
              </button>
              <button
                onClick={keepRecipeTune}
                className={primaryButtonClass}
                disabled={!recipeTuneDraft}
              >
                Keep Change
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSavedRecipe && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(17,17,17,0.45)] p-4 sm:items-center">
          <div className={`flex max-h-[calc(100vh-2rem)] w-full min-w-0 flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(17,17,17,0.12)] ${isMobileLayout ? 'max-w-[calc(100vw-2rem)]' : 'max-w-[min(64rem,calc(100vw-2rem))]'}`}>
            <div className="flex shrink-0 items-start justify-between border-b border-[#E5E7EB] px-6 py-5">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Saved Recipe</p>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#111111]">
                  {getDisplayRecipeTitle(selectedSavedRecipe)}
                </h3>
                <p className="mt-1 text-[14px] capitalize text-[#6B7280]">{selectedSavedRecipe.mealType}</p>
              </div>
              <button
                onClick={() => setSelectedSavedRecipe(null)}
                className="rounded-[8px] p-2 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="min-w-0">
                  {selectedSavedRecipe.styleTag && (
                    <span className="mb-3 inline-flex rounded-full bg-[rgba(17,17,17,0.06)] px-3 py-1 text-[11px] font-medium text-[#111111]">{selectedSavedRecipe.styleTag}</span>
                  )}
                  {selectedSavedRecipe.description && (
                    <p className="text-[15px] leading-relaxed text-[#6B7280]">{selectedSavedRecipe.description}</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedSavedRecipe.prepTime && (
                      <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                        <Clock size={12} className="mr-2 text-[#111111]" />
                        {selectedSavedRecipe.prepTime}
                      </div>
                    )}
                    {selectedSavedRecipe.cookTime && (
                      <div className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                        <Flame size={12} className="mr-2 text-[#111111]" />
                        {selectedSavedRecipe.cookTime}
                      </div>
                    )}
                    {getNutritionSummary(selectedSavedRecipe).map((item) => (
                      <div key={item} className="flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280]">
                        {item}
                      </div>
                    ))}
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
                            <span className="pt-0.5 text-[13px] font-semibold text-[#111111]">{index + 1}.</span>
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
                <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-[rgba(17,17,17,0.04)] px-5 py-4">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#111111]">
                    <Baby size={14} />
                    <span>Toddler Adaptation</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#6B7280]">{selectedSavedRecipe.toddlerAdaptation}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => openRecipeTuneModal(selectedSavedRecipe)}
                  className={secondaryButtonClass}
                >
                  Fine Tune
                </button>
                <button
                  onClick={() => deleteSavedRecipe(selectedSavedRecipe.id)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)]"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => toggleFavoriteRecipe(selectedSavedRecipe.id, selectedSavedRecipe.isFavorite)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition duration-200 ease-out ${
                    selectedSavedRecipe.isFavorite
                      ? 'border-[#111111] bg-[rgba(17,17,17,0.06)] text-[#111111]'
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
          <div className="w-full max-w-sm rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_24px_60px_rgba(17,17,17,0.12)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Saved Recipe</p>
              <h3 className="mt-2 break-words text-[18px] font-semibold text-[#111111]">{getDisplayRecipeTitle(activeSavedRecipeActions)}</h3>
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
                    ? 'border-[#111111] bg-[rgba(17,17,17,0.06)] text-[#111111]'
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
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)]"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => {
                  setSelectedSavedRecipe(activeSavedRecipeActions);
                  setActiveSavedRecipeActions(null);
                }}
                className={primaryButtonClass}
              >
                View Details
              </button>
              <button
                onClick={() => {
                  openRecipeTuneModal(activeSavedRecipeActions);
                  setActiveSavedRecipeActions(null);
                }}
                className={primaryButtonClass}
              >
                Fine Tune Recipe
              </button>
              <button
                onClick={() => {
                  setRecipeQuestionTarget(activeSavedRecipeActions);
                  setRecipeQuestion('');
                  setRecipeAnswer('');
                  setActiveSavedRecipeActions(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-semibold text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"
              >
                <MessageSquareMore size={16} />
                Ask AI Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {recipeQuestionTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-4 sm:items-center" onClick={() => setRecipeQuestionTarget(null)}>
          <div className="w-full max-w-lg rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_24px_60px_rgba(17,17,17,0.12)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">Ask AI</p>
                <h3 className="mt-2 break-words text-[18px] font-semibold text-[#111111]">{recipeQuestionTarget.title}</h3>
              </div>
              <button
                onClick={() => setRecipeQuestionTarget(null)}
                className="rounded-[8px] p-2 text-[#6B7280] transition duration-200 ease-out hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <textarea
                className="min-h-[112px] w-full rounded-[10px] border border-[#E5E7EB] bg-white p-4 text-[15px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-2 focus:ring-[rgba(17,17,17,0.10)]"
                placeholder="Ask about substitutions, timing, technique, serving ideas, or adjustments..."
                value={recipeQuestion}
                onChange={(e) => setRecipeQuestion(e.target.value)}
              />
              <button
                onClick={askRecipeFollowUp}
                disabled={recipeQuestionLoading || !recipeQuestion.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#111111] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(17,17,17,0.18)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:bg-[#D1D5DB] disabled:shadow-none"
              >
                {recipeQuestionLoading ? <Loader2 className="animate-spin" size={16} /> : <MessageSquareMore size={16} />}
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
