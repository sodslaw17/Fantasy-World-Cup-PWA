-- ============================================================
-- Migration 013 (full): Add team color columns + seed all 48 teams
-- PASTE THIS ENTIRE FILE into the Supabase Dashboard SQL editor
-- and click "Run". Takes < 1 second.
-- ============================================================

-- 1. Add columns
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS theme_primary_hex   TEXT,
  ADD COLUMN IF NOT EXISTS theme_secondary_hex TEXT;

-- 2. Seed all 48 WC26 teams
-- primary  = dominant color → headers/nav/buttons in bold theming
-- secondary = accent → wave strip, --brand-2 highlights
-- Colors: official kit/flag primary, non-white secondary for visible accents.
-- Confirm any you want to change before running.

UPDATE teams SET theme_primary_hex = '#006233', theme_secondary_hex = '#D21034' WHERE fifa_code = 'ALG'; -- Algeria: green flag / red crescent
UPDATE teams SET theme_primary_hex = '#74ACDF', theme_secondary_hex = '#F2B33D' WHERE fifa_code = 'ARG'; -- Argentina: celeste / sun gold
UPDATE teams SET theme_primary_hex = '#00843D', theme_secondary_hex = '#FFD700' WHERE fifa_code = 'AUS'; -- Australia: Socceroos green / gold
UPDATE teams SET theme_primary_hex = '#ED2939', theme_secondary_hex = '#BF0A30' WHERE fifa_code = 'AUT'; -- Austria: red flag / deeper red
UPDATE teams SET theme_primary_hex = '#000000', theme_secondary_hex = '#F7D117' WHERE fifa_code = 'BEL'; -- Belgium: black kit / Belgian yellow
UPDATE teams SET theme_primary_hex = '#002395', theme_secondary_hex = '#FFCD00' WHERE fifa_code = 'BIH'; -- Bosnia: blue / yellow diamond
UPDATE teams SET theme_primary_hex = '#009C3B', theme_secondary_hex = '#FFDF00' WHERE fifa_code = 'BRA'; -- Brazil: green / yellow
UPDATE teams SET theme_primary_hex = '#003893', theme_secondary_hex = '#CF2027' WHERE fifa_code = 'CPV'; -- Cabo Verde: navy / red
UPDATE teams SET theme_primary_hex = '#FF0000', theme_secondary_hex = '#8B0000' WHERE fifa_code = 'CAN'; -- Canada: maple red / deep red
UPDATE teams SET theme_primary_hex = '#F77F00', theme_secondary_hex = '#009A44' WHERE fifa_code = 'CIV'; -- Côte d'Ivoire: orange / green
UPDATE teams SET theme_primary_hex = '#007FFF', theme_secondary_hex = '#CE1020' WHERE fifa_code = 'COD'; -- DR Congo: blue / red
UPDATE teams SET theme_primary_hex = '#FCD116', theme_secondary_hex = '#003087' WHERE fifa_code = 'COL'; -- Colombia: yellow / blue
UPDATE teams SET theme_primary_hex = '#FF0000', theme_secondary_hex = '#00205B' WHERE fifa_code = 'CRO'; -- Croatia: red / dark blue crest
UPDATE teams SET theme_primary_hex = '#003F87', theme_secondary_hex = '#F7D116' WHERE fifa_code = 'CUR'; -- Curaçao: deep blue / yellow
UPDATE teams SET theme_primary_hex = '#D7141A', theme_secondary_hex = '#11457E' WHERE fifa_code = 'CZE'; -- Czechia: red / blue
UPDATE teams SET theme_primary_hex = '#FFD100', theme_secondary_hex = '#003580' WHERE fifa_code = 'ECU'; -- Ecuador: yellow / blue
UPDATE teams SET theme_primary_hex = '#CE1126', theme_secondary_hex = '#000000' WHERE fifa_code = 'EGY'; -- Egypt: red / black
UPDATE teams SET theme_primary_hex = '#C8102E', theme_secondary_hex = '#012169' WHERE fifa_code = 'ENG'; -- England: St George red / Union blue
UPDATE teams SET theme_primary_hex = '#002395', theme_secondary_hex = '#ED2939' WHERE fifa_code = 'FRA'; -- France: blue / red tricolore
UPDATE teams SET theme_primary_hex = '#1A1A1A', theme_secondary_hex = '#FFCE00' WHERE fifa_code = 'GER'; -- Germany: black kit / gold flag
UPDATE teams SET theme_primary_hex = '#C90B16', theme_secondary_hex = '#FCD116' WHERE fifa_code = 'GHA'; -- Ghana: red / gold star
UPDATE teams SET theme_primary_hex = '#00209F', theme_secondary_hex = '#D21034' WHERE fifa_code = 'HAI'; -- Haiti: blue / red
UPDATE teams SET theme_primary_hex = '#239F40', theme_secondary_hex = '#DA0000' WHERE fifa_code = 'IRN'; -- IR Iran: green / red
UPDATE teams SET theme_primary_hex = '#CE1126', theme_secondary_hex = '#007A3D' WHERE fifa_code = 'IRQ'; -- Iraq: red / green
UPDATE teams SET theme_primary_hex = '#BC002D', theme_secondary_hex = '#6B0013' WHERE fifa_code = 'JPN'; -- Japan: crimson / deep crimson
UPDATE teams SET theme_primary_hex = '#007A3D', theme_secondary_hex = '#CE1126' WHERE fifa_code = 'JOR'; -- Jordan: green / red
UPDATE teams SET theme_primary_hex = '#006847', theme_secondary_hex = '#CE1126' WHERE fifa_code = 'MEX'; -- Mexico: green / red
UPDATE teams SET theme_primary_hex = '#C1272D', theme_secondary_hex = '#006233' WHERE fifa_code = 'MAR'; -- Morocco: red / green
UPDATE teams SET theme_primary_hex = '#FF6600', theme_secondary_hex = '#003DA5' WHERE fifa_code = 'NED'; -- Netherlands: orange / blue
UPDATE teams SET theme_primary_hex = '#000000', theme_secondary_hex = '#CC0000' WHERE fifa_code = 'NZL'; -- New Zealand: black / red
UPDATE teams SET theme_primary_hex = '#EF2B2D', theme_secondary_hex = '#003680' WHERE fifa_code = 'NOR'; -- Norway: red / blue cross
UPDATE teams SET theme_primary_hex = '#DA121A', theme_secondary_hex = '#1C3F94' WHERE fifa_code = 'PAN'; -- Panama: red / blue
UPDATE teams SET theme_primary_hex = '#D52B1E', theme_secondary_hex = '#003DA5' WHERE fifa_code = 'PAR'; -- Paraguay: red / blue
UPDATE teams SET theme_primary_hex = '#C8102E', theme_secondary_hex = '#006600' WHERE fifa_code = 'POR'; -- Portugal: red kit / green flag
UPDATE teams SET theme_primary_hex = '#8D1B3D', theme_secondary_hex = '#5C1130' WHERE fifa_code = 'QAT'; -- Qatar: maroon / deep maroon
UPDATE teams SET theme_primary_hex = '#006C35', theme_secondary_hex = '#004A23' WHERE fifa_code = 'KSA'; -- Saudi Arabia: green / deep green
UPDATE teams SET theme_primary_hex = '#003366', theme_secondary_hex = '#FFD700' WHERE fifa_code = 'SCO'; -- Scotland: dark blue / gold lion
UPDATE teams SET theme_primary_hex = '#00853F', theme_secondary_hex = '#FDEF42' WHERE fifa_code = 'SEN'; -- Senegal: green / yellow
UPDATE teams SET theme_primary_hex = '#007A4D', theme_secondary_hex = '#FFB81C' WHERE fifa_code = 'RSA'; -- South Africa: green / gold
UPDATE teams SET theme_primary_hex = '#CD2E3A', theme_secondary_hex = '#0047A0' WHERE fifa_code = 'KOR'; -- South Korea: red / blue taeguk
UPDATE teams SET theme_primary_hex = '#AA151B', theme_secondary_hex = '#F1BF00' WHERE fifa_code = 'ESP'; -- Spain: red / yellow
UPDATE teams SET theme_primary_hex = '#006AA7', theme_secondary_hex = '#FECC02' WHERE fifa_code = 'SWE'; -- Sweden: blue / yellow
UPDATE teams SET theme_primary_hex = '#FF0000', theme_secondary_hex = '#A30000' WHERE fifa_code = 'SUI'; -- Switzerland: red / deep red
UPDATE teams SET theme_primary_hex = '#E70013', theme_secondary_hex = '#A30000' WHERE fifa_code = 'TUN'; -- Tunisia: red / deep red
UPDATE teams SET theme_primary_hex = '#E30A17', theme_secondary_hex = '#A00010' WHERE fifa_code = 'TUR'; -- Turkiye: red / deep red
UPDATE teams SET theme_primary_hex = '#5AADF7', theme_secondary_hex = '#F2C94C' WHERE fifa_code = 'URU'; -- Uruguay: sky blue / sun gold
UPDATE teams SET theme_primary_hex = '#B22234', theme_secondary_hex = '#3C3B6E' WHERE fifa_code = 'USA'; -- USA: Old Glory red / navy
UPDATE teams SET theme_primary_hex = '#0055A5', theme_secondary_hex = '#1EB53A' WHERE fifa_code = 'UZB'; -- Uzbekistan: blue / green
