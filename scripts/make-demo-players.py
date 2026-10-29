"""Makes data/demo-players.json: 30 made-up demo players with original, generated skins,
plus skins for the 10 seed players (p1..p10). Run: python3 scripts/make-demo-players.py
Everyone and every skin here is invented. Nothing is copied from real players."""
import base64, io, json, random
from PIL import Image

R = random.Random(42)

SKIN_TONES = ["#f6d1b4", "#eab68e", "#d19a6b", "#b97e52", "#8d5a37", "#6b4128", "#4a2c1b"]
HAIR = ["#1d1410", "#3b2416", "#6b4423", "#a8742f", "#d8b25a", "#e8d6a0", "#b3402a", "#d0d0d0", "#4a7de0", "#d548a0", "#3fa86a"]
EYES = ["#3b6fd8", "#2f8f4a", "#5a3a1e", "#1d1d1d", "#7a4fb5", "#2fb8c7"]
SHIRTS = ["#4f8a2b", "#2a7fb8", "#c2372f", "#c28a1c", "#7a4fb5", "#2fb8c7", "#e07a2f", "#333a44", "#e8e8e8", "#b8326f", "#1f6b5a"]
PANTS = ["#2b3a67", "#3d2b57", "#333333", "#5a4632", "#46523a", "#6b6b6b", "#1d2a44"]
SHOES = ["#3a3a3a", "#5a3a1e", "#e8e8e8", "#1d1d1d", "#8b2a2a"]

def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c)

def make_skin():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    px = img.load()
    def put(x, y, c, jitter=0.06):
        k = 1 + R.uniform(-jitter, jitter)
        px[x, y] = shade(c, k) + (255,)
    def box(x0, y0, w, h, color_at):
        for y in range(h):
            for x in range(w):
                put(x0 + x, y0 + y, color_at(x, y))

    skin = rgb(R.choice(SKIN_TONES)); hair = rgb(R.choice(HAIR)); eye = rgb(R.choice(EYES))
    shirt = rgb(R.choice(SHIRTS)); trim = shade(shirt, 0.72); pants = rgb(R.choice(PANTS)); shoe = rgb(R.choice(SHOES))
    style = R.choice(["short", "short", "long", "fringe", "bald", "buzz"])
    pattern = R.choice(["plain", "stripe", "hoodie", "vest", "collar"])
    sleeves = R.choice([4, 6, 12])  # how far down the arm the sleeve goes
    beard = R.random() < 0.18
    glasses = R.random() < 0.15
    cap = R.random() < 0.2
    cap_color = rgb(R.choice(SHIRTS))

    hair_rows = {"short": 2, "long": 2, "fringe": 3, "bald": 0, "buzz": 1}[style]
    # Head: all six faces.
    def head_side(long_hair):
        def f(x, y):
            if y < hair_rows or (long_hair and y < 7 and style == "long"): return hair
            if beard and y >= 6: return shade(hair, 0.9)
            return skin
        return f
    box(8, 0, 8, 8, lambda x, y: hair if hair_rows else skin)       # top
    box(16, 0, 8, 8, lambda x, y: skin)                                # bottom
    box(0, 8, 8, 8, head_side(True)); box(16, 8, 8, 8, head_side(True))  # sides
    box(24, 8, 8, 8, lambda x, y: hair if (hair_rows and (y < 6 or style == "long")) else skin)  # back
    def face(x, y):
        if y < hair_rows: return hair
        if style == "fringe" and y == 3 and x < 5: return hair
        if style == "long" and (x == 0 or x == 7) and y < 6: return hair
        if y == 4 and x in (1, 6): return (240, 240, 240)
        if y == 4 and x in (2, 5): return eye
        if y == 3 and x in (1, 2, 5, 6) and hair_rows: return shade(hair, 0.85)  # brows
        if beard and (y >= 6 or (y == 5 and x in (0, 7))): return shade(hair, 0.9)
        if y == 6 and x in (3, 4): return shade(skin, 0.7)  # mouth
        if y == 5 and x in (3, 4): return shade(skin, 0.85)  # nose
        return skin
    box(8, 8, 8, 8, face)
    if glasses:
        for x in (9, 10, 11, 12, 13, 14): px[x, 12] = (20, 20, 20, 255)
        for x in (9, 10, 13, 14): px[x, 12] = (120, 200, 230, 255)
        px[11, 12] = px[12, 12] = (20, 20, 20, 255)
    if cap:  # hat layer: a cap on top and around the head
        for x in range(32 + 8, 32 + 16):
            for y in range(0, 8): put(x, y, cap_color)
        for x0 in (32, 32 + 16, 32 + 24):
            for x in range(x0, x0 + 8): put(x, 8, cap_color); put(x, 9, cap_color)
        for x in range(32 + 8, 32 + 16): put(x, 8, cap_color); put(x, 9, shade(cap_color, 0.75))

    # Body
    def torso(front):
        def f(x, y):
            if pattern == "stripe" and y % 4 == 1: return trim
            if pattern == "hoodie" and front and y >= 7 and 1 <= x <= 6: return trim  # pocket
            if pattern == "hoodie" and front and y < 2 and x in (2, 5): return (230, 230, 230)  # strings
            if pattern == "vest" and front and 2 <= x <= 5: return (235, 235, 235)
            if pattern == "collar" and front and y == 0: return (240, 240, 240)
            if y == 11: return shade(pants, 0.8)  # belt
            return shirt
        return f
    box(20, 16, 8, 4, lambda x, y: shirt); box(28, 16, 8, 4, lambda x, y: shirt)
    box(16, 20, 4, 12, torso(False)); box(20, 20, 8, 12, torso(True))
    box(28, 20, 4, 12, torso(False)); box(32, 20, 8, 12, torso(False))

    # Arms (right at 40,16 and left at 32,48)
    def arm(x, y): return shirt if y < sleeves else skin
    for (ox, oy) in ((40, 16), (32, 48)):
        box(ox + 4, oy, 4, 4, lambda x, y: shirt); box(ox + 8, oy, 4, 4, lambda x, y: skin)
        for i in range(4): box(ox + i * 4, oy + 4, 4, 12, arm)

    # Legs (right at 0,16 and left at 16,48)
    def leg(x, y): return shoe if y >= 10 else pants
    for (ox, oy) in ((0, 16), (16, 48)):
        box(ox + 4, oy, 4, 4, lambda x, y: pants); box(ox + 8, oy, 4, 4, lambda x, y: shoe)
        for i in range(4): box(ox + i * 4, oy + 4, 4, 12, leg)

    out = io.BytesIO()
    img.save(out, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(out.getvalue()).decode()

PLAYERS = [
  ("Maya Lindqvist", "MayaMinesAlot", 24, "Europe", "Java", ["PC"], ["Survival", "SMP", "Creative"], "Builder", True,
   "Fake player. I build medieval towns and then make up drama for the villagers.", ["medieval builds", "villagers", "shaders"], "A cozy SMP with other builders",
   [("My dream build", "A castle on a floating island with a working drawbridge."), ("I'm weirdly good at", "Making roofs that don't look like tents."), ("We'll get along if", "You like to plan builds before you start.")]),
  ("Theo Vance", "TheoTNT", 22, "US West", "Bedrock", ["Xbox"], ["Bedwars", "PvP", "Minigames"], "Fighter", True,
   "Fake player. Bedwars main. My bridging is fast and my strategy is faster.", ["Bedwars", "clutches", "parkour"], "A Bedwars duo who calls out rushers",
   [("I'm weirdly good at", "Fireball jumping across the map."), ("Server I keep going back to", "Anything with a busy Bedwars queue."), ("We'll get along if", "You defend the bed like it's your house.")]),
  ("Priya Raman", "RedstonePriya", 27, "Asia", "Java", ["PC"], ["Redstone", "Survival", "Modded"], "Redstoner", False,
   "Fake player. I build flying machines for fun and sorting systems for my friends.", ["flying machines", "slime blocks", "automation"], "Someone who likes big technical projects",
   [("My dream build", "A fully automatic wool farm in every color."), ("The mod I can't play without", "Litematica."), ("We'll get along if", "You don't mind repeaters everywhere.")]),
  ("Jonah Price", "JonahJumps", 31, "US Central", "Java", ["PC", "Mac"], ["Speedrunning", "Hardcore"], "Speedrunner", True,
   "Fake player. Practicing set-seed runs. Always up for a race.", ["any%", "piglin trading", "bastions"], "A rival to race random seeds against",
   [("My first night strategy", "Skip it. Straight to the nether."), ("I'm weirdly good at", "Bartering with piglins."), ("We'll get along if", "You're fine with a bit of trash talk.")]),
  ("Sofia Moreno", "SofiaSkyblock", 25, "Latin America", "Both", ["PC", "Mobile"], ["Skyblock", "Minigames", "Survival"], "Farmer", True,
   "Fake player. Skyblock grinder. My island has more farms than blocks.", ["Skyblock", "farms", "trading"], "Co-op Skyblock partners",
   [("I'm weirdly good at", "Making money in the auction house."), ("Server I keep going back to", "Skyblock servers with a good economy."), ("My worst creeper disaster", "One got onto my island. Half my cobble gen is gone.")]),
  ("Ethan Brooks", "EthanExplores", 29, "Canada", "Bedrock", ["Switch", "Mobile"], ["Survival", "Creative"], "Explorer", False,
   "Fake player. I map every biome I find. My book of coordinates is huge.", ["maps", "biomes", "shipwrecks"], "An exploring buddy for long trips",
   [("My dream build", "A railway that links every biome I've found."), ("My first night strategy", "Dig into a hill and wait."), ("We'll get along if", "You enjoy just wandering around.")]),
  ("Aisha Bello", "AishaBuildsBig", 33, "Africa", "Java", ["PC"], ["Creative", "Roleplay", "SMP"], "Builder", True,
   "Fake player. I make huge organic builds: trees, dragons, giant statues.", ["organics", "terraforming", "WorldEdit"], "A build team for big creative projects",
   [("My dream build", "A dragon wrapped around a mountain."), ("The mod I can't play without", "WorldEdit, forever."), ("I'm weirdly good at", "Making builds look natural.")]),
  ("Lucas Ferreira", "LucasLava", 21, "Latin America", "Java", ["PC"], ["PvP", "Hardcore", "Survival"], "Fighter", True,
   "Fake player. Crystal PvP and hardcore. I like it when the stakes are high.", ["crystal PvP", "netherite", "duels"], "A hardcore partner who won't panic",
   [("My worst creeper disaster", "Hardcore day 3. It snuck up while I was mining iron."), ("I'm weirdly good at", "Shield timing."), ("We'll get along if", "You keep calm in a fight.")]),
  ("Hana Sato", "HanaHarvests", 26, "Asia", "Bedrock", ["Switch"], ["Survival", "Creative"], "Farmer", False,
   "Fake player. I grow every crop and keep way too many animals.", ["farms", "animals", "cozy builds"], "A chill survival world, no stress",
   [("My dream build", "A farm village with a windmill and a bakery."), ("I'm weirdly good at", "Breeding the perfect horse."), ("We'll get along if", "You name the cows with me.")]),
  ("Marcus Hill", "MarcusMods", 36, "US East", "Java", ["PC"], ["Modded", "Survival", "SMP"], "Redstoner", True,
   "Fake player. I've played every big modpack. Factories are my happy place.", ["Create", "ATM packs", "factories"], "A modded crew for a long modpack run",
   [("The mod I can't play without", "Create. Spinning gears forever."), ("My dream build", "A train network that delivers ore to the base."), ("We'll get along if", "You like long modpack grinds.")]),
  ("Elena Petrova", "ElenaEnchants", 28, "Europe", "Java", ["PC", "Mac"], ["Survival", "SMP"], "Miner", False,
   "Fake player. I mine, I enchant, I organize the chests. Every server needs one of me.", ["enchanting", "storage", "mining"], "A survival team that likes to plan",
   [("I'm weirdly good at", "Labeling every chest."), ("My first night strategy", "Shelter, then caves with torches."), ("We'll get along if", "You put items back in the right chest.")]),
  ("Kai Nakamura", "KaiCrafts", 23, "Oceania", "Both", ["PC", "PlayStation"], ["Minigames", "Bedwars", "Skyblock"], "Chill", True,
   "Fake player. Minigames every night. Bad at parkour, great at being fun.", ["minigames", "parkour fails", "Build Battle"], "People for a minigames party",
   [("Server I keep going back to", "Anywhere with Build Battle."), ("I'm weirdly good at", "Guessing builds in Build Battle."), ("We'll get along if", "You laugh when we lose.")]),
  ("Grace Okonkwo", "GraceGolem", 30, "UK", "Java", ["PC"], ["Survival", "Redstone", "SMP"], "Builder", True,
   "Fake player. I love shopping districts and building shops on SMPs.", ["shops", "trading halls", "storefronts"], "A friendly SMP with a shop district",
   [("My dream build", "A market street with a shop for every item."), ("I'm weirdly good at", "Trading with villagers."), ("We'll get along if", "You buy stuff from my shop.")]),
  ("Diego Alvarez", "DiegoDigs", 34, "US West", "Bedrock", ["Xbox", "Mobile"], ["Survival", "Hardcore"], "Miner", False,
   "Fake player. Ancient debris hunter. I've dug more tunnels than anyone I know.", ["netherite", "tunnels", "beacons"], "A mining partner for a full-beacon world",
   [("My first night strategy", "Dig straight down. (Don't do this.)"), ("I'm weirdly good at", "Finding ancient debris."), ("We'll get along if", "You'll help me fill a beacon.")]),
  ("Nora Jensen", "NoraNether", 25, "Europe", "Java", ["PC"], ["Survival", "Modded", "Creative"], "Explorer", True,
   "Fake player. The nether is my favorite place. I built a house in a basalt delta.", ["nether", "striders", "fortresses"], "A survival partner who likes adventure",
   [("My dream build", "A nether city full of lava lights."), ("My worst creeper disaster", "One blew a hole in my nether portal frame."), ("We'll get along if", "You aren't scared of ghasts.")]),
  ("Sam Rivera", "SammyStacks", 20, "US East", "Bedrock", ["PlayStation"], ["Bedwars", "Minigames", "PvP"], "Fighter", True,
   "Fake player. Bedwars and Skywars mostly. I'm a team player, promise.", ["Skywars", "Bedwars", "combos"], "A squad for ranked Bedwars",
   [("I'm weirdly good at", "Getting the last kill."), ("Server I keep going back to", "Big minigame servers."), ("We'll get along if", "You talk on mic during games.")]),
  ("Ivy Chen", "IvyInteriors", 29, "Canada", "Java", ["PC"], ["Creative", "Survival"], "Builder", False,
   "Fake player. Interior designer of blocks. Kitchens are my specialty.", ["interiors", "furniture", "texture packs"], "Builders who care about the inside too",
   [("My dream build", "A mansion where every room is different."), ("I'm weirdly good at", "Making furniture out of stairs and trapdoors."), ("We'll get along if", "You let me decorate your base.")]),
  ("Omar Haddad", "OmarOnTheRails", 37, "Europe", "Java", ["PC", "Mac"], ["Survival", "SMP", "Redstone"], "Chill", True,
   "Fake player. I build railways. Long, scenic railways.", ["railways", "minecarts", "stations"], "An SMP that needs a transport system",
   [("My dream build", "A rail line with a station in every village."), ("I'm weirdly good at", "Laying powered rails just right."), ("We'll get along if", "You like a slow scenic ride.")]),
  ("Lily Thompson", "LilyLlama", 22, "UK", "Bedrock", ["Switch", "Mobile"], ["Survival", "Creative", "Roleplay"], "Chill", False,
   "Fake player. I collect llamas, cats and parrots. Mostly a pet sim at this point.", ["pets", "llamas", "cozy builds"], "Cozy players who love animals",
   [("My dream build", "A pet hotel with a room for every mob."), ("My worst creeper disaster", "It got my parrot's tree. RIP."), ("We'll get along if", "You never hit my llamas.")]),
  ("Ben Carter", "BenBuildsBridges", 41, "US Central", "Java", ["PC"], ["Survival", "Creative"], "Builder", True,
   "Fake player. Dad gamer, weekend builder. Bridges are my thing.", ["bridges", "rivers", "terraforming"], "Weekend survival with relaxed people",
   [("My dream build", "A suspension bridge over a huge ravine."), ("My first night strategy", "Bed in a boat. Works every time."), ("We'll get along if", "You play at a relaxed pace.")]),
  ("Zara Ahmed", "ZaraZaps", 24, "Africa", "Both", ["PC", "Xbox"], ["Redstone", "Skyblock", "Minigames"], "Redstoner", True,
   "Fake player. I make minigames with redstone and command blocks.", ["command blocks", "minigames", "data packs"], "Players to test my custom minigames",
   [("I'm weirdly good at", "Command blocks."), ("My dream build", "A full arcade made only with redstone."), ("We'll get along if", "You'll play-test my weird games.")]),
  ("Felix Wagner", "FelixFarms", 32, "Europe", "Java", ["PC"], ["Survival", "Modded", "Skyblock"], "Farmer", False,
   "Fake player. Farm efficiency nerd. My iron farm makes too much iron.", ["iron farms", "rates", "mob farms"], "A technical survival group",
   [("I'm weirdly good at", "Calculating farm rates."), ("The mod I can't play without", "Carpet mod for testing."), ("We'll get along if", "You care about items per hour.")]),
  ("Rosa Delgado", "RosaRoleplays", 27, "US West", "Java", ["PC"], ["Roleplay", "SMP", "Creative"], "Builder", True,
   "Fake player. I write lore for my builds. Every town has a story.", ["lore", "roleplay", "medieval towns"], "Roleplay server friends",
   [("My dream build", "A kingdom with a royal family and a rebel camp."), ("Server I keep going back to", "Small roleplay SMPs."), ("We'll get along if", "You stay in character.")]),
  ("Leo Martins", "LeoLeaps", 19, "Latin America", "Bedrock", ["Mobile"], ["Minigames", "Bedwars", "Survival"], "Chill", True,
   "Fake player. Plays on my phone on the bus. Parkour every day.", ["parkour", "mobile", "minigames"], "Bedrock friends who play on mobile",
   [("I'm weirdly good at", "Parkour on a phone screen."), ("My first night strategy", "Run to a village."), ("We'll get along if", "You don't mind touch controls.")]),
  ("Chloe Dubois", "ChloeCastles", 35, "Europe", "Java", ["Mac"], ["Creative", "Survival"], "Builder", False,
   "Fake player. Castles, cathedrals and a lot of stone bricks.", ["castles", "gothic builds", "stone bricks"], "A builder to work on big monuments",
   [("My dream build", "A cathedral with stained glass in every window."), ("I'm weirdly good at", "Mixing stone blocks for texture."), ("We'll get along if", "You like big, slow projects.")]),
  ("Tyler Reed", "TylerTames", 26, "US East", "Both", ["PC", "Switch"], ["Survival", "Hardcore", "Modded"], "Explorer", True,
   "Fake player. Hardcore explorer. I always bring too many golden apples.", ["hardcore", "adventure maps", "dungeons"], "A hardcore adventure partner",
   [("My worst creeper disaster", "Hardcore. Night one. Never again."), ("My first night strategy", "Tower up and wait it out."), ("We'll get along if", "You share your golden apples.")]),
  ("Mei Lin", "MeiMushroom", 23, "Asia", "Java", ["PC"], ["Survival", "Creative", "SMP"], "Chill", True,
   "Fake player. Mushroom island fan. I'll build there if you let me.", ["mushroom islands", "mooshrooms", "cute builds"], "Chill SMP friends",
   [("My dream build", "A giant mushroom house village."), ("I'm weirdly good at", "Finding mushroom islands fast."), ("We'll get along if", "You think mooshrooms are the best mob.")]),
  ("Andre Silva", "AndreAnvil", 39, "Latin America", "Java", ["PC"], ["PvP", "SMP", "Survival"], "Fighter", False,
   "Fake player. SMP defender. I build walls, then guard them.", ["bases", "defense", "PvP"], "An SMP with factions and wars",
   [("My dream build", "A fortress with a moat and lava traps."), ("I'm weirdly good at", "Spotting sneaky raiders."), ("We'll get along if", "You're on my faction.")]),
  ("Hannah Wright", "HannahHearth", 30, "Oceania", "Bedrock", ["Xbox", "Switch"], ["Survival", "Creative"], "Farmer", True,
   "Fake player. Cottage builder, bread baker, Realm owner.", ["Realms", "cottages", "gardens"], "Nice people for my Realm",
   [("My dream build", "A seaside cottage town."), ("Server I keep going back to", "My own Realm with friends."), ("We'll get along if", "You help with the wheat.")]),
  ("Raj Patel", "RajRunsSeeds", 28, "UK", "Java", ["PC"], ["Speedrunning", "Survival", "Redstone"], "Speedrunner", True,
   "Fake player. Speedruns on weekdays, chill survival on weekends.", ["speedruns", "seeds", "practice"], "Speedrun practice partners",
   [("I'm weirdly good at", "Finding end portals on the first try."), ("My first night strategy", "Iron, bucket, go."), ("We'll get along if", "You time everything.")]),
]

created = []
for (name, tag, age, region, edition, platforms, modes, style, mic, bio, interests, looking, prompts) in PLAYERS:
    created.append({
        "name": name, "gamertag": tag, "age": age, "city": region, "edition": edition, "platforms": platforms,
        "modes": modes, "playstyle": style, "mic": mic, "bio": bio, "interests": interests, "lookingFor": looking,
        "prompts": [{"question": q, "answer": a} for q, a in prompts], "skin": make_skin(),
    })
update = {f"p{i}": make_skin() for i in range(1, 11)}
assert len(created) == 30
json.dump({"create": created, "update": update}, open("data/demo-players.json", "w"), indent=1)
print(len(created), "players,", sum(len(p["skin"]) for p in created) // len(created), "chars per skin")
