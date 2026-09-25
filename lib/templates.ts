import type { Recurrence } from "@/types/database";

export type ChoreTemplate = {
  title: string;
  icon: string;
  points: number;
  recurrence: Recurrence;
  days_of_week?: number[];
  requires_approval?: boolean;
  description?: string;
};

export type RewardTemplate = {
  title: string;
  icon: string;
  cost: number;
  category: "privilege" | "item" | "experience";
  requires_approval?: boolean;
  description?: string;
};

export type AgeBand = "little" | "middle" | "big";

export const AGE_BANDS: { key: AgeBand; label: string; range: string; blurb: string }[] = [
  { key: "little", label: "Little Explorers", range: "Ages 3-6", blurb: "Simple, visual quests with quick wins." },
  { key: "middle", label: "Young Adventurers", range: "Ages 7-10", blurb: "Daily routines plus a few real responsibilities." },
  { key: "big", label: "Big Questers", range: "Ages 11+", blurb: "Bigger jobs, bigger rewards, more independence." },
];

export const CHORE_PACKS: Record<AgeBand, ChoreTemplate[]> = {
  little: [
    { title: "Brush teeth", icon: "🪥", points: 5, recurrence: "daily", requires_approval: false },
    { title: "Put toys away", icon: "🧸", points: 10, recurrence: "daily" },
    { title: "Get dressed by myself", icon: "👕", points: 5, recurrence: "daily", requires_approval: false },
    { title: "Feed the pet", icon: "🐾", points: 10, recurrence: "daily" },
    { title: "Put dirty clothes in hamper", icon: "🧺", points: 5, recurrence: "daily" },
    { title: "Help set the table", icon: "🍽️", points: 10, recurrence: "custom", days_of_week: [1, 2, 3, 4, 5] },
    { title: "Water the plants", icon: "🪴", points: 10, recurrence: "custom", days_of_week: [0, 3] },
  ],
  middle: [
    { title: "Make your bed", icon: "🛏️", points: 5, recurrence: "daily", requires_approval: false },
    { title: "Brush teeth (morning + night)", icon: "🪥", points: 5, recurrence: "daily", requires_approval: false },
    { title: "Homework done", icon: "📚", points: 15, recurrence: "custom", days_of_week: [1, 2, 3, 4] },
    { title: "Read for 20 minutes", icon: "📖", points: 10, recurrence: "daily" },
    { title: "Clear the table", icon: "🍽️", points: 10, recurrence: "daily" },
    { title: "Feed the pet", icon: "🐾", points: 10, recurrence: "daily" },
    { title: "Tidy bedroom", icon: "🧹", points: 20, recurrence: "custom", days_of_week: [6] },
    { title: "Take out recycling", icon: "♻️", points: 15, recurrence: "custom", days_of_week: [2] },
  ],
  big: [
    { title: "Homework + study", icon: "📚", points: 20, recurrence: "custom", days_of_week: [1, 2, 3, 4] },
    { title: "Load / unload dishwasher", icon: "🫧", points: 15, recurrence: "daily" },
    { title: "Fold and put away laundry", icon: "👕", points: 25, recurrence: "custom", days_of_week: [0, 3] },
    { title: "Vacuum living room", icon: "🧹", points: 25, recurrence: "custom", days_of_week: [6] },
    { title: "Take out trash + recycling", icon: "🗑️", points: 15, recurrence: "custom", days_of_week: [1, 4] },
    { title: "Cook one meal or side", icon: "👩‍🍳", points: 40, recurrence: "custom", days_of_week: [0] },
    { title: "Walk the dog", icon: "🐕", points: 15, recurrence: "daily" },
    { title: "Screen-free hour", icon: "📵", points: 10, recurrence: "daily", requires_approval: false },
  ],
};

export const EXTRA_CHORE_PACKS: { key: string; label: string; items: ChoreTemplate[] }[] = [
  {
    key: "pets",
    label: "Pets",
    items: [
      { title: "Feed the pet", icon: "🐾", points: 10, recurrence: "daily" },
      { title: "Walk the dog", icon: "🐕", points: 15, recurrence: "daily" },
      { title: "Clean the litter box", icon: "🐱", points: 15, recurrence: "daily" },
      { title: "Fill water bowl", icon: "🥣", points: 5, recurrence: "daily", requires_approval: false },
    ],
  },
  {
    key: "lawn",
    label: "Yard",
    items: [
      { title: "Water the plants", icon: "🪴", points: 10, recurrence: "custom", days_of_week: [0, 3] },
      { title: "Pick up sticks", icon: "🌿", points: 10, recurrence: "custom", days_of_week: [6] },
      { title: "Help mow the lawn", icon: "🚜", points: 30, recurrence: "custom", days_of_week: [6] },
      { title: "Sweep the porch", icon: "🧹", points: 10, recurrence: "custom", days_of_week: [0] },
    ],
  },
  {
    key: "homework",
    label: "Homework",
    items: [
      { title: "Homework done", icon: "📚", points: 15, recurrence: "custom", days_of_week: [1, 2, 3, 4] },
      { title: "Read for 20 minutes", icon: "📖", points: 10, recurrence: "daily" },
      { title: "Pack backpack", icon: "🎒", points: 5, recurrence: "custom", days_of_week: [0, 1, 2, 3, 4], requires_approval: false },
      { title: "Practice an instrument", icon: "🎹", points: 15, recurrence: "custom", days_of_week: [1, 3, 5] },
    ],
  },
  {
    key: "halloween",
    label: "Seasonal",
    items: [
      { title: "Halloween tidy", icon: "🎃", points: 20, recurrence: "once" },
      { title: "Decorate together", icon: "🎄", points: 15, recurrence: "once" },
      { title: "Write thank-you notes", icon: "✉️", points: 15, recurrence: "once" },
      { title: "Spring clean one room", icon: "✨", points: 25, recurrence: "once" },
    ],
  },
];

export const REWARD_PACK: RewardTemplate[] = [
  { title: "30 min extra screen time", icon: "🎮", cost: 40, category: "privilege" },
  { title: "Pick tonight's dinner", icon: "🍕", cost: 60, category: "privilege" },
  { title: "Stay up 30 min late", icon: "🌙", cost: 50, category: "privilege" },
  { title: "Movie night pick", icon: "🍿", cost: 80, category: "experience" },
  { title: "Ice cream trip", icon: "🍦", cost: 300, category: "experience" },
  { title: "$5 allowance", icon: "💵", cost: 250, category: "item" },
  { title: "Friend sleepover", icon: "🎉", cost: 300, category: "experience" },
  { title: "New book or toy (up to $15)", icon: "🎁", cost: 750, category: "item" },
  { title: "Indoor fort night", icon: "⛺", cost: 50, category: "privilege" },
  { title: "Pick a rainy-day movie", icon: "🌧️", cost: 40, category: "privilege" },
  { title: "Bake cookies together", icon: "🍪", cost: 80, category: "experience" },
  { title: "Board game of your choice", icon: "🎲", cost: 35, category: "privilege" },
];

export const CHORE_ICONS = [
  "🧹", "🛏️", "🪥", "📚", "📖", "🍽️", "🧺", "🐾", "🐕", "🪴", "♻️", "🗑️", "🫧", "👕", "🧸", "👩‍🍳",
  "🚿", "🧽", "🚲", "🎒", "🧦", "🥣", "🍎", "🎹", "⚽", "📵", "🧼", "🪟", "🍳", "🛒", "🚗", "🌿",
  "🐱", "🚜", "🎃", "🎄", "✉️", "✨",
];

export const REWARD_ICONS = [
  "🎁", "🎮", "🍕", "🌙", "🍿", "🍦", "💵", "🎉", "🎨", "🎢", "🧁", "🍩", "🎬", "🛼", "🎪",
  "🧩", "📱", "🎧", "🍔", "🏕️", "🎳", "🛍️", "⭐", "🚀", "🎯", "🪁", "🎸", "🍫", "🍪", "🎲", "🌧️",
];

export const CURRENCY_PRESETS = [
  { name: "Stars", emoji: "⭐" },
  { name: "Gems", emoji: "💎" },
  { name: "Coins", emoji: "🪙" },
  { name: "Points", emoji: "✨" },
  { name: "Hearts", emoji: "💖" },
  { name: "Acorns", emoji: "🌰" },
];
