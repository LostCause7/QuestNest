import type { CosmeticItem, UnlockRule } from "@/lib/cosmetics";

const free: UnlockRule = { by: "free" };
const shop: UnlockRule = { by: "gift" };
const streak = (value: number): UnlockRule => ({ by: "streak", value });
const badge = (value: string): UnlockRule => ({ by: "badge", value });
const set = (value: string): UnlockRule => ({ by: "set", value });
const season = (value: number): UnlockRule => ({ by: "season", value });

function face(key: string, label: string, emoji: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "face", label, emoji, unlock, cost };
}
function color(key: string, label: string, className: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "color", label, className, unlock, cost };
}
function frame(key: string, label: string, className: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "frame", label, className, unlock, cost };
}
function aura(key: string, label: string, className: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "aura", label, className, unlock, cost };
}
function name(key: string, label: string, className: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "nameplate", label, className, unlock, cost };
}
function banner(key: string, label: string, className: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "banner", label, className, unlock, cost };
}
function title(key: string, label: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "title", label, unlock, cost };
}
function room(key: string, label: string, emoji: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "room", label, emoji, unlock, cost };
}
function sound(key: string, label: string, emoji: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "soundPack", label, emoji, unlock, cost };
}
function confetti(key: string, label: string, emoji: string, unlock: UnlockRule, cost?: number): CosmeticItem {
  return { key, kind: "confetti", label, emoji, unlock, cost };
}

/* Extra faces — the 10 starters live in lib/avatars.ts and stay free. */
export const GATED_FACES: CosmeticItem[] = [
  face("dice", "Dice", "🎲", streak(3), 22),
  face("bolt", "Bolt", "⚡", badge("first_quest"), 24),
  face("bunny", "Bunny", "🐰", streak(3), 24),
  face("skate", "Skate", "🛹", season(4), 26),
  face("fox", "Fox", "🦊", badge("first_reward"), 26),
  face("gamepad", "Gamepad", "🎮", streak(5), 28),
  face("owl", "Owl", "🦉", season(6), 28),
  face("bee", "Bee", "🐝", badge("first_quest"), 30),
  face("otter", "Otter", "🦦", streak(5), 30),
  face("camera", "Camera", "📷", shop, 32),
  face("frog", "Frog", "🐸", badge("quests_10"), 34),
  face("dino", "Dino", "🦖", streak(7), 36),
  face("koala", "Koala", "🐨", season(8), 36),
  face("unicorn", "Unicorn", "🦄", badge("perfect_day_1"), 40),
  face("hawk", "Hawk", "🦅", streak(7), 40),
  face("mushroom", "Mushroom", "🍄", shop, 42),
  face("moon", "Moon", "🌙", season(10), 44),
  face("lion", "Lion", "🦁", badge("streak_7"), 46),
  face("comet", "Comet", "☄️", streak(10), 48),
  face("octopus", "Octopus", "🐙", season(12), 50),
  face("astronaut", "Astronaut", "🧑‍🚀", shop, 55),
  face("cactus", "Cactus", "🌵", badge("quests_10"), 52),
  face("owlkid", "Raccoon", "🦝", streak(10), 54),
  face("ghost", "Ghost", "👻", season(14), 58),
  face("whale", "Whale", "🐋", badge("kindness_10"), 60),
  face("crystal", "Crystal", "💎", set("starter"), 65),
  face("fairy", "Fairy", "🧚", shop, 70),
  face("panther", "Panther", "🐆", streak(14), 72),
  face("taco", "Taco", "🌮", season(16), 68),
  face("wizard", "Wizard", "🧙", badge("quests_50"), 80),
  face("ice", "Ice", "❄️", streak(14), 78),
  face("skull", "Skull", "💀", shop, 82),
  face("shark", "Shark", "🦈", season(18), 85),
  face("mic", "Mic", "🎤", badge("first_reward"), 64),
  face("alien", "Alien", "👽", set("quests"), 95),
  face("helmetface", "Racer", "🏎️", streak(21), 100),
  face("snowman", "Snowman", "⛄", season(20), 90),
  face("rose", "Rose", "🌹", badge("kindness_10"), 88),
  face("butterfly", "Butterfly", "🦋", shop, 110),
  face("parrot", "Parrot", "🦜", streak(21), 115),
  face("cyber", "Cyber", "👾", set("perfect"), 130),
  face("mermaid", "Mermaid", "🧜", season(24), 140),
  face("foxmask", "Kitsune", "🎭", shop, 160),
  face("elf", "Elf", "🧝", badge("quests_50"), 150),
  face("orbitface", "Orbit", "🛰️", streak(30), 180),
  face("rocket", "Rocket", "🚀", set("collector"), 200),
  face("music", "Music", "🎧", streak(3), 28),
  face("penguin", "Penguin", "🐧", streak(3), 28),
  face("sloth", "Sloth", "🦥", streak(3), 28),
  face("fire", "Fire", "🔥", streak(5), 36),
  face("turtle", "Turtle", "🐢", streak(7), 44),
  face("wolfmoon", "Howl", "🌕", streak(10), 55),
  face("vampire", "Vampire", "🧛", streak(14), 75),
  face("robot", "Robot", "🤖", season(5), 34),
  face("monkey", "Monkey", "🐵", badge("first_quest"), 32),
  face("tiger", "Tiger", "🐯", streak(5), 38),
  face("guitar", "Guitar", "🎸", badge("quests_10"), 48),
  face("ninja", "Ninja", "🥷", season(10), 56),
  face("flamingo", "Flamingo", "🦩", streak(7), 50),
  face("samurai", "Samurai", "⚔️", set("quests"), 120),
  face("cookie", "Cookie", "🍪", badge("first_reward"), 30),
  face("soccer", "Soccer", "⚽", badge("first_quest"), 26),
  face("hoops", "Hoops", "🏀", badge("first_quest"), 26),
  face("hedgehog", "Hedgehog", "🦔", badge("quests_10"), 42),
  face("lionface", "Pride", "🦁", badge("streak_7"), 58),
  face("superhero", "Hero", "🦸", badge("quests_50"), 125),
  face("panda", "Panda", "🐼", badge("quests_10"), 42),
  face("dragon", "Dragon", "🐲", season(36), 140),
  face("crownface", "Crown", "👑", set("collector"), 190),
];

export const GATED_COLORS: CosmeticItem[] = [
  color("lava", "Lava", "from-red-500 to-orange-600", streak(7), 40),
  color("ice", "Ice", "from-cyan-200 to-sky-400", streak(3), 22),
  color("galaxy", "Galaxy", "from-fuchsia-600 to-indigo-800", set("collector"), 95),
  color("peach", "Peach", "from-orange-200 to-rose-300", badge("first_quest"), 24),
  color("moss", "Moss", "from-green-600 to-emerald-800", season(8), 38),
  color("ink", "Ink", "from-slate-700 to-zinc-900", badge("quests_10"), 36),
  color("lemon", "Lemon", "from-yellow-200 to-lime-400", streak(3), 20),
  color("aurora", "Aurora", "from-teal-300 via-sky-400 to-purple-500", shop, 110),
  color("chrome", "Chrome", "from-slate-200 via-zinc-400 to-slate-600", shop, 18),
  color("obsidian", "Obsidian", "from-zinc-800 to-black", streak(5), 20),
  color("volt", "Volt", "from-lime-300 to-emerald-500", season(4), 18),
  color("blush", "Blush", "from-rose-300 to-pink-500", badge("first_reward"), 18),
  color("cobalt", "Cobalt", "from-blue-600 to-indigo-800", shop, 20),
  color("sand", "Sand", "from-amber-200 to-orange-400", streak(3), 16),
  color("steel", "Steel", "from-slate-400 to-slate-700", season(5), 18),
  color("orchid", "Orchid", "from-purple-400 to-fuchsia-600", badge("perfect_day_1"), 22),
  color("neonlime", "Neon Lime", "from-lime-300 to-green-400", streak(5), 28),
  color("hotpink", "Hot Pink", "from-pink-500 to-rose-600", season(6), 28),
  color("toxic", "Toxic", "from-lime-400 via-emerald-500 to-teal-700", shop, 48),
  color("bloodmoon", "Blood Moon", "from-red-700 to-rose-900", streak(7), 44),
  color("holo", "Holo", "from-pink-400 via-sky-400 to-violet-500", set("perfect"), 100),
  color("goldfoil", "Gold Foil", "from-yellow-300 via-amber-400 to-yellow-600", badge("quests_50"), 130),
  color("iridium", "Iridium", "from-cyan-300 via-fuchsia-400 to-indigo-500", shop, 160),
  color("void", "Void", "from-violet-950 to-black", streak(21), 85),
  color("fire", "Fire", "qn-color-fire", shop, 120),
  color("lightning", "Lightning", "qn-color-lightning", streak(14), 125),
  color("cyberpunk", "Cyberpunk", "qn-color-cyberpunk", season(16), 130),
  color("magma", "Magma", "qn-color-magma", shop, 118),
  color("plasma", "Plasma", "qn-color-plasma", set("perfect"), 150),
  color("hologram", "Hologram", "qn-color-hologram", shop, 145),
  color("venom", "Venom", "qn-color-venom", streak(14), 122),
  color("frostbite", "Frostbite", "qn-color-frostbite", season(18), 128),
  color("nebula", "Nebula", "qn-color-nebula", set("collector"), 160),
  color("circuit", "Circuit", "qn-color-circuit", shop, 135),
];

export const FRAME_ITEMS: CosmeticItem[] = [
  frame("none", "Plain", "ring-4 ring-white/90", free),
  frame("dashed", "Dashed", "border-4 border-dashed border-white/90", shop, 14),
  frame("thin", "Thin", "ring-2 ring-white", shop, 12),
  frame("inkring", "Ink", "ring-4 ring-zinc-900", streak(3), 16),
  frame("softglow", "Soft Glow", "ring-4 ring-white shadow-[0_0_16px_rgba(255,255,255,0.7)]", season(4), 18),
  frame("square", "Square", "rounded-xl ring-4 ring-slate-300", shop, 14),
  frame("gold", "Gold", "ring-4 ring-amber-400", badge("streak_7"), 55),
  frame("sun", "Sunny", "ring-4 ring-sun-400", streak(3), 22),
  frame("mint", "Mint", "ring-4 ring-emerald-400", season(8), 32),
  frame("coral", "Coral", "ring-4 ring-orange-400", badge("first_reward"), 36),
  frame("rainbow", "Rainbow", "ring-4 ring-fuchsia-400", set("collector"), 140),
  frame("sparkle", "Sparkle", "ring-4 ring-yellow-300 shadow-[0_0_16px_rgba(253,224,71,0.7)]", shop, 110),
  frame("crown", "Crown", "ring-4 ring-amber-300", badge("quests_100"), 180),
  frame("hearts", "Hearts", "ring-4 ring-pink-400 shadow-[0_0_0_7px_rgba(244,114,182,0.35)]", badge("first_quest"), 24),
  frame("stars", "Stars", "ring-4 ring-yellow-300 shadow-[0_0_0_7px_rgba(253,224,71,0.35)]", streak(5), 26),
  frame("leaves", "Leaves", "ring-4 ring-green-500 shadow-[0_0_0_7px_rgba(34,197,94,0.3)]", streak(3), 22),
  frame("pixel", "Pixel", "ring-4 ring-lime-300 ring-offset-2 ring-offset-lime-700", badge("quests_10"), 40),
  frame("icy", "Icy", "ring-4 ring-cyan-200 shadow-[0_0_14px_rgba(165,243,252,0.9)]", season(12), 50),
  frame("lava", "Lava", "ring-4 ring-red-500 shadow-[0_0_14px_rgba(239,68,68,0.8)]", streak(10), 62),
  frame("moon", "Moonlight", "ring-4 ring-indigo-300 shadow-[0_0_18px_rgba(165,180,252,0.8)]", season(10), 48),
  frame("pulse", "Pulse", "ring-4 ring-fuchsia-400 qn-frame-pulse", shop, 75),
  frame("shimmer", "Shimmer", "ring-4 ring-yellow-300 qn-frame-shimmer", set("perfect"), 120),
  frame("orbit", "Orbit", "ring-4 ring-sky-300 qn-frame-orbit", streak(30), 200),
  frame("weekcrown", "Week Crown", "ring-4 ring-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.9)] qn-frame-shimmer", streak(7), 58),
  frame("questset", "Quest Master", "ring-4 ring-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.8)]", set("quests"), 95),
  frame("chrome", "Chrome", "qn-ring-chrome", shop, 20),
  frame("glass", "Glass", "qn-ring-glass", season(5), 18),
  frame("frostframe", "Frosted", "qn-ring-frost", streak(5), 30),
  frame("mirrorframe", "Mirror", "qn-ring-mirror", badge("perfect_day_1"), 52),
  frame("holoframe", "Holo", "qn-ring-holo", shop, 100),
  frame("carbon", "Carbon", "qn-ring-carbon", season(14), 60),
  frame("neonframe", "Neon", "ring-4 ring-lime-400 shadow-[0_0_18px_rgba(163,230,53,0.85)]", streak(7), 42),
  frame("roseframe", "Rose Gold", "ring-4 ring-rose-300 shadow-[0_0_14px_rgba(251,113,133,0.7)]", badge("kindness_10"), 50),
  frame("voidframe", "Void", "ring-4 ring-violet-950 shadow-[0_0_16px_rgba(46,16,101,0.8)]", streak(21), 88),
  frame("keep", "Medieval", "qn-ornament-medieval ring-2 ring-stone-500", shop, 130),
  frame("cyberhex", "Cyber", "qn-ornament-cyber ring-2 ring-cyan-300", season(16), 140),
  frame("jewelry", "Jewelry", "qn-ornament-jewelry ring-2 ring-amber-300", set("collector"), 165),
  frame("gems", "Gems", "qn-ornament-gems ring-2 ring-violet-300", shop, 155),
  frame("runic", "Runic", "qn-ornament-runic ring-2 ring-amber-400", streak(21), 148),
  frame("laurel", "Laurel", "qn-ornament-laurel ring-2 ring-lime-400", badge("quests_50"), 142),
  frame("stained", "Stained Glass", "qn-ornament-stained ring-2 ring-yellow-400", season(20), 152),
  frame("dragonscale", "Dragonscale", "qn-ornament-dragonscale ring-2 ring-emerald-700", shop, 170),
  frame("baroque", "Baroque", "qn-ornament-baroque ring-2 ring-yellow-500", set("perfect"), 175),
  frame("neonhex", "Neon Hex", "qn-ornament-neonhex ring-2 ring-lime-300", shop, 138),
];

export const HAT_ITEMS: CosmeticItem[] = [
  { key: "none", kind: "hat", label: "None", emoji: "∅", unlock: free },
];

export const AURA_ITEMS: CosmeticItem[] = [
  aura("none", "None", "", free),
  aura("softwhite", "Soft White", "from-white to-slate-200", shop, 14),
  aura("sun", "Sunbeam", "from-amber-300 to-orange-400", streak(3), 22),
  aura("mint", "Mint", "from-emerald-300 to-teal-400", season(8), 34),
  aura("berry", "Berry", "from-pink-400 to-fuchsia-500", streak(3), 24),
  aura("sky", "Sky", "from-sky-300 to-blue-500", badge("first_quest"), 26),
  aura("ember", "Ember", "from-red-500 to-amber-400", streak(10), 60),
  aura("galaxy", "Galaxy", "from-indigo-500 to-fuchsia-600", set("collector"), 110),
  aura("gold", "Gold", "from-yellow-300 to-amber-500", badge("quests_50"), 150),
  aura("chromeaura", "Chrome", "from-slate-100 to-zinc-400", shop, 18),
  aura("frostaura", "Frost", "from-cyan-100 to-sky-300", season(6), 32),
  aura("voltaura", "Volt", "from-lime-300 to-emerald-400", streak(7), 46),
  aura("rosaaura", "Rose", "from-rose-200 to-pink-400", badge("kindness_10"), 40),
  aura("voidaura", "Void", "from-violet-700 to-black", streak(14), 70),
  aura("holoaura", "Holo", "from-pink-400 via-sky-300 to-violet-400", shop, 120),
  aura("storm", "Storm", "from-slate-400 to-indigo-700", streak(10), 58),
  aura("stormcloud", "Lightning Storm", "", shop, 150),
  aura("flower", "Flower", "", streak(21), 155),
  aura("cyberdata", "Cyber Data", "", season(18), 160),
  aura("fairydust", "Fairy Dust", "", shop, 148),
  aura("glitch", "Glitch", "", set("perfect"), 170),
  aura("sakura", "Sakura", "", badge("kindness_10"), 145),
  aura("holy", "Radiant", "", set("collector"), 180),
  aura("voidrift", "Void Rift", "", shop, 175),
];

export const NAMEPLATE_ITEMS: CosmeticItem[] = [
  name("none", "Plain", "", free),
  name("ink", "Ink", "rounded-md bg-zinc-900 px-2 text-white", shop, 14),
  name("tape", "Tape", "rounded-sm bg-amber-100 px-2 text-amber-950 -rotate-1", streak(3), 16),
  name("stamp", "Stamp", "rounded-sm border-2 border-zinc-800 px-2 uppercase tracking-wide", season(4), 16),
  name("wood", "Wood", "rounded-lg bg-amber-800 px-2 text-amber-50", badge("first_quest"), 22),
  name("neon", "Neon", "text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.95)]", streak(7), 48),
  name("scroll", "Scroll", "rounded-md bg-amber-100 px-2 font-serif text-amber-900", badge("quests_10"), 36),
  name("comic", "Comic", "-rotate-2 rounded-md bg-yellow-300 px-2 text-black", streak(3), 24),
  name("royal", "Royal", "bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent", set("collector"), 140),
  name("frost", "Frost", "rounded-lg bg-cyan-100/90 px-2 text-cyan-900", season(12), 70),
  name("chromeplate", "Chrome", "qn-chrome-text", shop, 18),
  name("glassplate", "Glass", "qn-glass rounded-lg px-2", season(5), 18),
  name("frostplate", "Frosted", "qn-frost rounded-lg px-2", streak(5), 30),
  name("mirrorplate", "Mirror", "qn-mirror rounded-lg px-2 text-slate-800", badge("perfect_day_1"), 52),
  name("holoplate", "Holo", "qn-holo rounded-lg px-2", shop, 100),
  name("graffiti", "Graffiti", "-rotate-2 rounded-md bg-lime-400 px-2 font-black uppercase text-zinc-900", streak(7), 42),
  name("gamer", "Gamer", "rounded-md bg-zinc-950 px-2 font-mono text-lime-300", badge("quests_10"), 46),
  name("script", "Script", "font-serif italic text-rose-700", season(8), 28),
  name("carbonplate", "Carbon", "qn-carbon rounded-lg px-2 text-white", shop, 60),
];

export const BANNER_ITEMS: CosmeticItem[] = [
  banner("none", "Clean", "", free),
  banner("paper", "Paper", "qn-banner-paper", shop, 12),
  banner("skybar", "Sky", "qn-banner-sky", streak(3), 14),
  banner("mintbar", "Mint", "qn-banner-mint", season(4), 14),
  banner("inkbar", "Ink", "qn-banner-ink", shop, 14),
  banner("glass", "Frosted Glass", "qn-glass", badge("first_quest"), 16),
  banner("mirror", "Mirror", "qn-mirror", streak(5), 28),
  banner("chrome", "Chrome", "qn-chrome", season(8), 34),
  banner("frost", "Ice Frost", "qn-frost", streak(7), 40),
  banner("holo", "Holo", "qn-holo qn-holo-banner", shop, 95),
  banner("carbon", "Carbon", "qn-carbon text-white", badge("quests_10"), 55),
  banner("velvet", "Velvet", "qn-velvet", season(12), 50),
  banner("prism", "Prism", "qn-prism", set("perfect"), 110),
  banner("obsidian", "Obsidian", "qn-obsidian", streak(10), 48),
  banner("rosefoil", "Rose Foil", "qn-rose-foil", badge("kindness_10"), 62),
  banner("aurora", "Aurora", "qn-aurora-banner", streak(7), 58),
  banner("circuit", "Circuit", "qn-circuit", shop, 70),
  banner("stadium", "Stadium", "qn-stadium", badge("quests_10"), 44),
  banner("concert", "Concert", "qn-concert", season(16), 75),
  banner("locker", "Locker", "qn-locker", streak(3), 26),
];

export const TITLE_ITEMS: CosmeticItem[] = [
  title("rookie", "Rookie", free),
  title("ace", "Ace", shop, 12),
  title("spark", "Spark", streak(3), 14),
  title("wildcard", "Wildcard", season(4), 14),
  title("scout", "Scout", badge("first_quest"), 16),
  title("clutch", "Clutch", streak(5), 22),
  title("captain", "Captain", badge("quests_10"), 32),
  title("rival", "Rival", season(8), 36),
  title("ghost", "Ghost", shop, 40),
  title("volt", "Volt", streak(7), 38),
  title("ember", "Ember", badge("perfect_day_1"), 42),
  title("frost", "Frost", season(10), 42),
  title("nova", "Nova", shop, 50),
  title("echo", "Echo", streak(10), 52),
  title("drift", "Drift", badge("streak_7"), 55),
  title("pixel", "Pixel", season(12), 48),
  title("mvp", "MVP", streak(5), 28),
  title("pro", "Pro", badge("quests_10"), 40),
  title("storm", "Storm", streak(7), 44),
  title("phoenix", "Phoenix", set("streaks"), 90),
  title("shadow", "Shadow", shop, 62),
  title("neon", "Neon", season(14), 58),
  title("icon", "Icon", badge("quests_50"), 110),
  title("legend", "Legend", set("collector"), 160),
  title("mythic", "Mythic", streak(30), 220),
  title("kindred", "Kindred", badge("kindness_10"), 70),
  title("unstoppable", "Unstoppable", badge("streak_30"), 150),
  title("perfect", "Perfect", badge("perfect_day_1"), 48),
  title("striker", "Striker", season(9), 40),
  title("maestro", "Maestro", shop, 75),
  title("cipher", "Cipher", streak(14), 80),
  title("vanguard", "Vanguard", set("quests"), 95),
  title("sovereign", "Sovereign", set("collector"), 180),
];

export const STICKER_ITEMS: CosmeticItem[] = [{ key: "star", kind: "sticker", label: "Star", emoji: "⭐", unlock: free }];

export const ROOM_ITEMS: CosmeticItem[] = [
  room("nest", "Nest", "🪺", free),
  room("loft", "Loft", "🪟", shop, 16),
  room("studio", "Studio", "🎛️", season(4), 18),
  room("sunrise", "Sunrise", "🌅", streak(3), 22),
  room("forest", "Forest", "🌲", badge("first_quest"), 34),
  room("ocean", "Ocean", "🌊", streak(3), 24),
  room("space", "Space", "🪐", shop, 70),
  room("candy", "Candy", "🍬", badge("first_reward"), 30),
  room("campfire", "Campfire", "🔥", streak(7), 44),
  room("night", "Night", "🌙", set("streaks"), 130),
  room("arena", "Arena", "🏟️", season(6), 20),
  room("arcade", "Arcade", "🕹️", streak(5), 28),
  room("glacier", "Glacier", "🧊", season(8), 36),
  room("volcano", "Volcano", "🌋", shop, 52),
  room("dojo", "Dojo", "🥋", badge("quests_10"), 46),
  room("stacks", "Stacks", "📚", streak(3), 24),
  room("rooftop", "Rooftop", "🌆", season(12), 50),
  room("circuit", "Circuit", "💡", shop, 62),
  room("garden", "Garden", "🌷", badge("kindness_10"), 32),
  room("garage", "Garage", "🔧", streak(5), 30),
  room("concert", "Concert", "🎤", badge("quests_50"), 80),
  room("locker", "Locker", "🏅", season(5), 22),
  room("aurora", "Aurora", "🌌", shop, 75),
  room("desert", "Desert", "🏜️", streak(7), 38),
  room("city", "City", "🏙️", season(14), 55),
  room("raincity", "Rain City", "🌧️", streak(10), 60),
];

export const SOUND_PACK_ITEMS: CosmeticItem[] = [
  sound("classic", "Classic", "🔔", free),
  sound("chiptune", "Chiptune", "🎮", streak(3), 22),
  sound("marimba", "Marimba", "🎶", season(8), 34),
  sound("space", "Space", "🛸", shop, 70),
  sound("animal", "Animal", "🐾", streak(3), 24),
  sound("drums", "Drums", "🥁", badge("quests_10"), 40),
];

export const CONFETTI_ITEMS: CosmeticItem[] = [
  confetti("circle", "Classic", "🎊", free),
  confetti("star", "Stars", "⭐", streak(5), 28),
  confetti("hearts", "Hearts", "💖", streak(3), 22),
  confetti("sparkles", "Sparkles", "✨", shop, 55),
  confetti("faces", "My face", "🙂", set("starter"), 90),
  confetti("fire", "Fire", "🔥", season(5), 18),
  confetti("ice", "Ice", "❄️", streak(5), 26),
  confetti("bolt", "Bolts", "⚡", badge("first_quest"), 30),
  confetti("game", "Game", "🎮", season(8), 38),
];
