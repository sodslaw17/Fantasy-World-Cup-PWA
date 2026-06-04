-- ============================================================
-- Demo seed — adds fake predictions, results, draft picks, and
-- efficiency data to the profiles already in the system.
--
-- Prerequisites:
--   1. Run migrations 001–004
--   2. Import teams.csv and fixtures.csv via Admin → Import
--   3. Add your 10 players via Admin → Players (or directly in SQL)
--   4. Each player must have clicked their magic link at least once
--      (so auth_id is populated on their profile row)
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE.
-- ============================================================


-- ── 1. Enter results for the first 12 group matches ─────────

update matches set home_goals=2, away_goals=0, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='MEX' and away_team_code='RSA';
update matches set home_goals=1, away_goals=1, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='KOR' and away_team_code='CZE';
update matches set home_goals=0, away_goals=1, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='CAN' and away_team_code='BIH';
update matches set home_goals=3, away_goals=2, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='USA' and away_team_code='PAR';
update matches set home_goals=0, away_goals=2, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='QAT' and away_team_code='SUI';
update matches set home_goals=1, away_goals=0, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='BRA' and away_team_code='MAR';
update matches set home_goals=0, away_goals=3, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='HAI' and away_team_code='SCO';
update matches set home_goals=1, away_goals=1, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='AUS' and away_team_code='TUR';
update matches set home_goals=4, away_goals=1, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='GER' and away_team_code='CUR';
update matches set home_goals=2, away_goals=0, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='NED' and away_team_code='JPN';
update matches set home_goals=1, away_goals=2, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='CIV' and away_team_code='ECU';
update matches set home_goals=0, away_goals=0, status='finished', went_to_et=false, went_to_shootout=false, shootout_winner=null where home_team_code='SWE' and away_team_code='TUN';


-- ── 2. Auto-populate match_stats (goals) for finished matches ─

insert into match_stats (match_id, team_code, goals, yellows, second_yellows, straight_reds)
select m.id, m.home_team_code, m.home_goals, 0, 0, 0
from matches m where m.status='finished' and m.home_team_code is not null
on conflict (match_id, team_code) do update set goals = excluded.goals;

insert into match_stats (match_id, team_code, goals, yellows, second_yellows, straight_reds)
select m.id, m.away_team_code, m.away_goals, 0, 0, 0
from matches m where m.status='finished' and m.away_team_code is not null
on conflict (match_id, team_code) do update set goals = excluded.goals;


-- ── 3. Add some card data for flavour ───────────────────────

-- MEX vs RSA: Mexico 1 yellow, RSA 2 yellows + 1 straight red
update match_stats set yellows=1 where match_id=(select id from matches where home_team_code='MEX' and away_team_code='RSA') and team_code='MEX';
update match_stats set yellows=2, straight_reds=1 where match_id=(select id from matches where home_team_code='MEX' and away_team_code='RSA') and team_code='RSA';

-- USA vs PAR: Paraguay 3 yellows, 1 second yellow (feisty match)
update match_stats set yellows=3, second_yellows=1 where match_id=(select id from matches where home_team_code='USA' and away_team_code='PAR') and team_code='PAR';
update match_stats set yellows=1 where match_id=(select id from matches where home_team_code='USA' and away_team_code='PAR') and team_code='USA';

-- SCO vs HAI (HAI away): Scotland physical
update match_stats set yellows=2 where match_id=(select id from matches where home_team_code='HAI' and away_team_code='SCO') and team_code='SCO';


-- ── 4. Generate predictions for all logged-in profiles ───────
-- Uses hashtext for varied but deterministic predictions.
-- Skips any profile that already has predictions (ON CONFLICT DO NOTHING).

insert into predictions (user_id, match_id, home_goals_pred, away_goals_pred)
select
  p.auth_id,
  m.id,
  -- home goals pred: 0-4, driven by user+match hash
  (abs(hashtext(p.auth_id::text || m.id::text))        % 5)::int as home_goals_pred,
  -- away goals pred: 0-3, driven by reversed hash
  (abs(hashtext(m.id::text || p.auth_id::text || 'a')) % 4)::int as away_goals_pred
from profiles p
cross join matches m
where p.auth_id is not null
  and m.stage = 'group'
on conflict (user_id, match_id) do nothing;


-- ── 5. Efficiency picks (1st Side Pot) ──────────────────────
-- Assigns a famous player to each profile in alphabetical email order.
-- Adjust names/stats to match your real player pool.

with ranked as (
  select id, row_number() over (order by email) as rn
  from profiles
),
picks(rn, player_name, team_code, goals, assists, minutes) as (
  values
    (1,  'Kylian Mbappé',      'FRA', 7, 5, 720),
    (2,  'Lionel Messi',       'ARG', 6, 7, 630),
    (3,  'Erling Haaland',     'NOR', 8, 2, 540),
    (4,  'Jude Bellingham',    'ENG', 4, 6, 720),
    (5,  'Vinícius Jr.',       'BRA', 5, 4, 600),
    (6,  'Pedri',              'ESP', 2, 8, 660),
    (7,  'Bukayo Saka',        'ENG', 4, 5, 630),
    (8,  'Federico Valverde',  'URU', 3, 4, 720),
    (9,  'Rúben Neves',        'POR', 3, 3, 540),
    (10, 'Nicolás Domínguez',  'ARG', 2, 3, 420)
)
insert into efficiency_picks (profile_id, player_name, team_code, goals, assists, minutes)
select r.id, pk.player_name, pk.team_code, pk.goals, pk.assists, pk.minutes
from ranked r
join picks pk on r.rn = pk.rn
on conflict (profile_id) do nothing;


-- ── 6. Draft preferences (snake position wishlist) ──────────

with ranked as (
  select id, row_number() over (order by email) as rn
  from profiles
),
prefs(rn, preferred_position, team_wishlist, notes) as (
  values
    (1,  1, array['FRA','BRA','GER'],          'I want position 1 — lock me in first!'),
    (2,  3, array['ARG','ENG','ESP'],           'Happy with 3 or 4. ARG is my must-have.'),
    (3,  7, array['GER','NED','POR'],           null),
    (4,  2, array['BRA','FRA','ENG'],           'Going for the big teams.'),
    (5,  5, array['ESP','URU','NOR'],           'Mbappé country or bust.'),
    (6,  9, array['ENG','SCO','CRO'],           'Keeping it British 🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
    (7,  4, array['NED','POR','COL'],           null),
    (8,  6, array['ARG','MEX','USA'],           'Americas focus.'),
    (9,  8, array['GER','BEL','DEN'],           'Solid defensive teams for cards pot too.'),
    (10, 10, array['BRA','FRA','ESP','ARG'],    'Last pick, going value.')
)
insert into draft_preferences (profile_id, preferred_position, team_wishlist, notes)
select r.id, p.preferred_position, p.team_wishlist, p.notes
from ranked r
join prefs p on r.rn = p.rn
on conflict (profile_id) do nothing;


-- ── Done ────────────────────────────────────────────────────
-- Check counts:
select 'matches finished' as label, count(*) from matches where status = 'finished'
union all
select 'predictions inserted', count(*) from predictions
union all
select 'efficiency picks', count(*) from efficiency_picks
union all
select 'draft preferences', count(*) from draft_preferences;
