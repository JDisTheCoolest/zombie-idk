-- Miner Finder database. Paste this whole file into the Supabase SQL editor and run it.
-- Safe to run again: it only creates what is missing and skips seed rows that already exist.

create table if not exists profiles (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  age         int  not null check (age >= 13 and age <= 120),
  city        text not null default '',          -- the region, e.g. "US East"
  bio         text not null default '',
  interests   text[] not null default '{}',
  looking_for text not null default '',
  color       text not null default '#5d9b3a',
  prompts     jsonb not null default '[]',
  gamertag    text not null default '',
  edition     text not null default 'Java' check (edition in ('Java', 'Bedrock', 'Both')),
  platforms   text[] not null default '{}',
  modes       text[] not null default '{}',
  playstyle   text not null default 'Chill',
  mic         boolean not null default false,
  skin        text check (skin is null or length(skin) < 40000), -- a 64x64 skin PNG as a data: URL
  created_at  timestamptz not null default now()
);

create table if not exists likes (
  from_id    text not null references profiles(id) on delete cascade,
  to_id      text not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);

create table if not exists passes (
  from_id    text not null references profiles(id) on delete cascade,
  to_id      text not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);

create table if not exists matches (
  id         text primary key default gen_random_uuid()::text,
  a          text not null references profiles(id) on delete cascade,
  b          text not null references profiles(id) on delete cascade,
  unmatched  boolean not null default false,
  created_at timestamptz not null default now()
);
-- Added after the first version. Safe to run on an older database.
alter table profiles add column if not exists skin text check (skin is null or length(skin) < 40000);

-- One match per pair, whichever order the two ids are in.
create unique index if not exists matches_pair on matches (least(a, b), greatest(a, b));

create table if not exists messages (
  id       text primary key default gen_random_uuid()::text,
  match_id text not null references matches(id) on delete cascade,
  from_id  text not null references profiles(id) on delete cascade,
  text     text not null check (length(text) between 1 and 1000),
  at       timestamptz not null default now()
);
create index if not exists messages_by_match on messages (match_id, at);

-- Lock every table. With RLS on and no policies, the public (anon) key can't read or write
-- anything. Only the app's server, which uses the secret key, can.
alter table profiles enable row level security;
alter table likes    enable row level security;
alter table passes   enable row level security;
alter table matches  enable row level security;
alter table messages enable row level security;

-- Seed: 10 fake adult players, all made up (from data/seed.json).
insert into profiles (id, name, age, city, bio, interests, looking_for, color, prompts, gamertag, edition, platforms, modes, playstyle, mic, created_at) values
  ('p1', 'Avery Stone', 29, 'US East', 'Fake player. I build way too many cozy cottages and then forget where I put them.', array['cottagecore','terraforming','shaders']::text[], 'A chill survival partner for a long-term world', '#4b36d9', '[{"question": "My dream build", "answer": "A whole village on stilts over a mangrove swamp."}, {"question": "My first night strategy", "answer": "Dirt hut, bed, panic."}, {"question": "We''ll get along if", "answer": "You don''t mind me renovating your house while you''re offline."}]'::jsonb, 'AveryBuilds', 'Java', array['PC']::text[], array['Survival','Creative','SMP']::text[], 'Builder', true, '2026-10-01T00:00:00Z'),
  ('p2', 'Jordan Reyes', 32, 'US East', 'Fake player. Runs the food supply on every server I join.', array['Create mod','farms','villager trading']::text[], 'People for a modded SMP, weeknights', '#d9634b', '[{"question": "I''m weirdly good at", "answer": "Getting villagers to give me Mending for one emerald."}, {"question": "The mod I can''t play without", "answer": "Farmer''s Delight. Obviously."}, {"question": "We''ll get along if", "answer": "You will eat the food I cook and be kind about it."}]'::jsonb, 'PaellaPickaxe', 'Both', array['Xbox','PC']::text[], array['Survival','Modded','SMP']::text[], 'Farmer', true, '2026-10-01T00:00:01Z'),
  ('p3', 'Sam Okafor', 27, 'US Central', 'Fake player. If it can be automated, I''ve automated it. Twice.', array['redstone','tech','farms']::text[], 'A builder to make my machines look less ugly', '#3f8f3a', '[{"question": "I''m weirdly good at", "answer": "Reading the wiki so nobody else has to."}, {"question": "My dream build", "answer": "A fully automatic sorting system for every item in the game."}, {"question": "We''ll get along if", "answer": "You don''t break my observer chains."}]'::jsonb, 'SamTheRuleBook', 'Java', array['PC']::text[], array['Redstone','Skyblock','Survival']::text[], 'Redstoner', false, '2026-10-01T00:00:02Z'),
  ('p4', 'Riley Chen', 35, 'US East', 'Fake player. Plants every flower in the game around my base. Every single one.', array['gardens','bees','interiors']::text[], 'Something calm, no PvP please', '#c28a1c', '[{"question": "My dream build", "answer": "A greenhouse with every plant, labeled with signs."}, {"question": "I''m weirdly good at", "answer": "Keeping bees alive."}, {"question": "We''ll get along if", "answer": "You don''t mind a very green base."}]'::jsonb, 'FernKeeper', 'Bedrock', array['Switch','Mobile']::text[], array['Creative','Survival']::text[], 'Chill', false, '2026-10-01T00:00:03Z'),
  ('p5', 'Casey Morgan', 41, 'US East', 'Fake player. Hardcore only. I''ve lost 14 worlds and I regret nothing.', array['ocean monuments','maps','boats']::text[], 'A hardcore duo who can keep their nerve', '#2a7fb8', '[{"question": "My worst creeper disaster", "answer": "Day 212, hardcore, opened my front door. That was it."}, {"question": "My first night strategy", "answer": "Boat out to sea and wait for sunrise."}, {"question": "We''ll get along if", "answer": "You keep a log of coordinates."}]'::jsonb, 'SpreadsheetSailor', 'Java', array['PC','Mac']::text[], array['Hardcore','Survival']::text[], 'Explorer', true, '2026-10-01T00:00:04Z'),
  ('p6', 'Taylor Brooks', 30, 'US West', 'Fake player. Bedwars rusher. I will bridge to your base in 9 seconds.', array['Bedwars','clutches','speed bridging']::text[], 'A Bedwars squad that actually defends', '#b8326f', '[{"question": "I''m weirdly good at", "answer": "Clutching with a water bucket."}, {"question": "Server I keep going back to", "answer": "Any server with a Bedwars queue under 10 seconds."}, {"question": "We''ll get along if", "answer": "You protect the bed while I go rush."}]'::jsonb, 'TacoTNT', 'Bedrock', array['PlayStation','Mobile']::text[], array['Bedwars','Minigames','PvP']::text[], 'Fighter', true, '2026-10-01T00:00:05Z'),
  ('p7', 'Morgan Ellis', 26, 'Europe', 'Fake player. Personal best is not good enough yet. Never will be.', array['any%','seeds','practice maps']::text[], 'Someone to race seeds against', '#6d4bd9', '[{"question": "My first night strategy", "answer": "There is no night. Nether by minute 4."}, {"question": "I''m weirdly good at", "answer": "Finding strongholds with two eyes."}, {"question": "We''ll get along if", "answer": "You don''t talk during the blaze rods."}]'::jsonb, 'EllisSpeedruns', 'Java', array['PC']::text[], array['Speedrunning','Hardcore']::text[], 'Speedrunner', true, '2026-10-01T00:00:06Z'),
  ('p8', 'Dana Whitfield', 38, 'Canada', 'Fake player. Strip miner at heart. My base is under bedrock level, basically.', array['caves','diamonds','Mekanism']::text[], 'A teammate who handles the surface stuff', '#1c8a7a', '[{"question": "My dream build", "answer": "A giant underground city lit by glowstone."}, {"question": "I''m weirdly good at", "answer": "Finding diamonds at Y=-58."}, {"question": "We''ll get along if", "answer": "You leave torches on the right wall."}]'::jsonb, 'DanaDigsDeep', 'Both', array['PC','Xbox']::text[], array['Survival','Modded']::text[], 'Miner', false, '2026-10-01T00:00:07Z'),
  ('p9', 'Quinn Alvarez', 28, 'US East', 'Fake player. Pixel art and giant statues. If it''s big, I''ve built it.', array['pixel art','statues','Axiom']::text[], 'Builders for a roleplay city project', '#d94b8f', '[{"question": "My dream build", "answer": "A 1:1 city with working trains."}, {"question": "Server I keep going back to", "answer": "Small whitelisted SMPs with friends."}, {"question": "We''ll get along if", "answer": "You like murals made of concrete blocks."}]'::jsonb, 'QuinnPaintsPixels', 'Java', array['PC']::text[], array['Creative','SMP','Roleplay']::text[], 'Builder', true, '2026-10-01T00:00:08Z'),
  ('p10', 'Jamie Patel', 33, 'US West', 'Fake player. Weekend survival, weeknight minigames. Mostly here for vibes.', array['Realms','minigames','pets']::text[], 'A Realm with nice people', '#8a6a1c', '[{"question": "My worst creeper disaster", "answer": "It blew up my dog''s house. The dog was fine. I was not."}, {"question": "My first night strategy", "answer": "Bed, then stare at sheep."}, {"question": "We''ll get along if", "answer": "You name all your pets."}]'::jsonb, 'JamieJustChillin', 'Bedrock', array['Xbox','Switch']::text[], array['Survival','Minigames','Skyblock']::text[], 'Chill', true, '2026-10-01T00:00:09Z')
on conflict (id) do nothing;

insert into likes (from_id, to_id) values
  ('p2', 'p1'),
  ('p3', 'p1'),
  ('p4', 'p1'),
  ('p1', 'p4'),
  ('p5', 'p6'),
  ('p5', 'p1'),
  ('p8', 'p1'),
  ('p1', 'p9'),
  ('p9', 'p1'),
  ('p1', 'p10'),
  ('p10', 'p1'),
  ('p2', 'p6'),
  ('p6', 'p2')
on conflict do nothing;

insert into passes (from_id, to_id) values
  ('p1', 'p7')
on conflict do nothing;

insert into matches (id, a, b) values
  ('m1', 'p1', 'p4'),
  ('m2', 'p1', 'p9'),
  ('m3', 'p1', 'p10'),
  ('m4', 'p2', 'p6')
on conflict do nothing;

insert into messages (id, match_id, from_id, text, at) values
  ('msg1', 'm1', 'p4', 'Hi Avery! Your village on stilts idea sounds amazing.', '2026-10-28T18:00:00.000Z'),
  ('msg2', 'm1', 'p1', 'Thanks! Are you on Java? I''m happy to hop on Bedrock for you.', '2026-10-28T18:05:00.000Z'),
  ('msg3', 'm1', 'p4', 'Bedrock on Switch. I''ll bring the bees.', '2026-10-28T18:07:00.000Z'),
  ('msg4', 'm2', 'p9', 'Want to help with the train station in my city build?', '2026-10-29T09:12:00.000Z'),
  ('msg5', 'm2', 'p1', 'Yes! Send me the server IP and I''ll be on tonight.', '2026-10-29T09:30:00.000Z'),
  ('msg6', 'm4', 'p6', 'Bedwars tonight? I''ll rush, you farm iron.', '2026-10-27T20:15:00.000Z'),
  ('msg7', 'm4', 'p2', 'Only if you promise to come back and defend this time.', '2026-10-27T20:40:00.000Z')
on conflict do nothing;
