-- Migration: 20260922000002_add_married_to_the_game_tour_cities.sql
-- Description: Adds all 12 confirmed tour cities from the official "Married to the Game" national tour poster
--              with exact, researched venue names, physical street addresses, and first dates.

INSERT INTO public.cities (id, name, state, country, tour_date, venue_name, venue_address, max_capacity, is_active, notes)
VALUES
    (
        '7a1b2c3d-0001-4a5b-8c7d-9e0f1a2b3c01',
        'Pleasanton',
        'CA',
        'USA',
        '2026-09-18',
        'Tommy T''s Comedy Club',
        '5104 Hopyard Rd, Pleasanton, CA 94588',
        50,
        TRUE,
        'Official Married to the Game Tour Stop. VIP Green Room check-in.'
    ),
    (
        '7a1b2c3d-0002-4a5b-8c7d-9e0f1a2b3c02',
        'Omaha',
        'NE',
        'USA',
        '2026-09-25',
        'Omaha Funny Bone Comedy Club',
        '710 N 114th St, Suite 210, Omaha, NE 68154',
        50,
        TRUE,
        'Official Married to the Game Tour Stop. VIP check-in at main entrance.'
    ),
    (
        '7a1b2c3d-0003-4a5b-8c7d-9e0f1a2b3c03',
        'Columbus',
        'GA',
        'USA',
        '2026-10-03',
        'Columbus Civic Center',
        '400 4th St, Columbus, GA 31901',
        60,
        TRUE,
        'Official Married to the Game Tour Stop. VIP check-in table at VIP Desk.'
    ),
    (
        '7a1b2c3d-0004-4a5b-8c7d-9e0f1a2b3c04',
        'Ontario',
        'CA',
        'USA',
        '2026-10-09',
        'Ontario Improv',
        '4555 Mills Cir, Ontario, CA 91764',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at Ontario Mills.'
    ),
    (
        '7a1b2c3d-0005-4a5b-8c7d-9e0f1a2b3c05',
        'Wellington',
        'FL',
        'USA',
        '2026-10-16',
        'Palm Beach Improv',
        '10300 Forest Hill Blvd, Wellington, FL 33414',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at The Mall at Wellington Green.'
    ),
    (
        '7a1b2c3d-0006-4a5b-8c7d-9e0f1a2b3c06',
        'Columbus',
        'OH',
        'USA',
        '2026-10-23',
        'Columbus Funny Bone Comedy Club',
        '145 Easton Town Center, Columbus, OH 43219',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at Easton Town Center.'
    ),
    (
        '7a1b2c3d-0007-4a5b-8c7d-9e0f1a2b3c07',
        'Tampa',
        'FL',
        'USA',
        '2026-11-06',
        'Tampa Funny Bone Comedy Club',
        '1600 E 8th Ave, Suite C-112, Tampa, FL 33605',
        50,
        TRUE,
        'Official Married to the Game Tour Stop in Ybor City.'
    ),
    (
        '7a1b2c3d-0008-4a5b-8c7d-9e0f1a2b3c08',
        'Baltimore',
        'MD',
        'USA',
        '2026-11-13',
        'Baltimore Comedy Factory',
        '5625 O''Donnell St, Baltimore, MD 21224',
        50,
        TRUE,
        'Official Married to the Game Tour Stop. VIP check-in at front entrance.'
    ),
    (
        '7a1b2c3d-0009-4a5b-8c7d-9e0f1a2b3c09',
        'Birmingham',
        'AL',
        'USA',
        '2026-11-20',
        'StarDome Comedy Club',
        '1818 Data Dr, Hoover, AL 35244',
        50,
        TRUE,
        'Official Married to the Game Tour Stop. VIP cohort check-in at StarDome lounge.'
    ),
    (
        '7a1b2c3d-0010-4a5b-8c7d-9e0f1a2b3c10',
        'Cleveland',
        'OH',
        'USA',
        '2026-12-04',
        'Cleveland Funny Bone Comedy Club',
        '1148 Main Ave, Cleveland, OH 44113',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at The Flats.'
    ),
    (
        '7a1b2c3d-0011-4a5b-8c7d-9e0f1a2b3c11',
        'Richmond',
        'VA',
        'USA',
        '2026-12-11',
        'Richmond Funny Bone Comedy Club',
        '11800 W Broad St, Suite 1090, Richmond, VA 23233',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at Short Pump Town Center.'
    ),
    (
        '7a1b2c3d-0012-4a5b-8c7d-9e0f1a2b3c12',
        'Lexington',
        'KY',
        'USA',
        '2026-12-18',
        'Comedy Off Broadway',
        '161 Lexington Green Cir, #C4, Lexington, KY 40503',
        50,
        TRUE,
        'Official Married to the Game Tour Stop at The Mall at Lexington Green.'
    )
ON CONFLICT (name, tour_date) DO UPDATE SET
    venue_name = EXCLUDED.venue_name,
    venue_address = EXCLUDED.venue_address,
    notes = EXCLUDED.notes,
    is_active = EXCLUDED.is_active,
    updated_at = TIMEZONE('utc', NOW());
