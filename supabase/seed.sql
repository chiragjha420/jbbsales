-- =====================================================================
-- JBB Sales - Production Seed Data (Optional for Initial Deployment)
-- Jai Balaji Billiards
-- =====================================================================

-- Note: In Supabase, users are first created in auth.users.
-- The profiles below correspond to initial users.

-- 1. Insert Initial Products
insert into public.products (id, name, sku, category, description, cost_price, recommended_price, minimum_price, keywords, active)
values
  ('a0000000-0000-0000-0000-000000000001', 'Tournament Snooker Table 12ft English Slates', 'JBB-TBL-12FT-ENG', 'Tables', 'Full tournament spec 12ft snooker table with Northern rubber cushions and English slates', 185000.00, 240000.00, 220000.00, array['snooker', 'table', '12ft', 'english', 'tournament', 'slates', 'cushions'], true),
  ('a0000000-0000-0000-0000-000000000002', 'Commercial Pool Table 8ft Italian Slate', 'JBB-TBL-8FT-POOL', 'Tables', '8ft commercial pool table with coin or ball-return option, sturdy hardwood frame', 95000.00, 135000.00, 120000.00, array['pool', 'table', '8ft', 'italian', 'slate', 'commercial', 'billiards'], true),
  ('a0000000-0000-0000-0000-000000000003', 'Handcrafted 3/4 Ash Wood Snooker Cue', 'JBB-CUE-34-ASH', 'Cues', 'Premium 3/4 jointed ash wood cue with ebony butt and brass ferrule (9.5mm tip)', 4200.00, 6800.00, 5800.00, array['cue', 'snooker', 'ash', '3/4', 'joint', 'ebony', 'handcrafted'], true),
  ('a0000000-0000-0000-0000-000000000004', 'Professional Maple Pool Cue 58 inch', 'JBB-CUE-POOL-MAPLE', 'Cues', '13mm tip professional maple cue with Irish linen wrap and quick-release joint', 3100.00, 5200.00, 4500.00, array['cue', 'pool', 'maple', 'billiards', 'linen', 'quick-release'], true),
  ('a0000000-0000-0000-0000-000000000005', 'Aramith Tournament Snooker Ball Set (2 1/16)', 'JBB-ACC-BALL-ARAMITH', 'Accessories', 'Genuine Belgian phenolic resin 1G tournament snooker ball set', 14500.00, 21000.00, 18500.00, array['balls', 'aramith', 'snooker', 'tournament', 'belgian', 'resin'], true),
  ('a0000000-0000-0000-0000-000000000006', 'Strachan 6811 Club Snooker Cloth 12ft', 'JBB-ACC-CLOTH-6811', 'Accessories', '100% pure wool English snooker cloth, pre-cut bed and cushions', 12000.00, 17500.00, 15500.00, array['cloth', 'strachan', '6811', 'snooker', 'wool', '12ft', 'green'], true),
  ('a0000000-0000-0000-0000-000000000007', 'Taom V10 Snooker Chalk (Box of 9)', 'JBB-ACC-CHALK-TAOM', 'Accessories', 'Dust-free, clean cue ball impact premium finish chalk from Finland', 2400.00, 3600.00, 3200.00, array['chalk', 'taom', 'v10', 'green', 'dust-free', 'accessories'], true),
  ('a0000000-0000-0000-0000-000000000008', 'Professional 3-Finger Snooker Glove (Left Hand)', 'JBB-ACC-GLOVE-PRO', 'Accessories', 'Breathable spandex friction-free cue bridge glove', 180.00, 350.00, 250.00, array['glove', 'bridge', 'spandex', 'breathable', 'accessories'], true),
  ('a0000000-0000-0000-0000-000000000009', 'Multi-functional Cue Tip Shaper & Scuffer', 'JBB-ACC-TIP-SHAPER', 'Accessories', 'Aircraft aluminum pocket cue tip radius gauge, trimmer and aerator', 110.00, 250.00, 180.00, array['tip', 'shaper', 'scuffer', 'trimmer', 'aerator', 'accessories'], true)
on conflict (id) do nothing;
