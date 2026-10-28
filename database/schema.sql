-- Recipe Finder database
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description varchar(500),
  category varchar(30) not null,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  prep_time_minutes integer not null default 0 check (prep_time_minutes between 0 and 600),
  cook_time_minutes integer not null default 0 check (cook_time_minutes between 0 and 1200),
  servings integer not null check (servings between 1 and 100),
  emoji varchar(8) not null default '🍽️',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_category_check check (
    category in ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian')
  )
);

create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_created_at_idx on public.recipes(created_at desc);
create index if not exists recipes_name_idx on public.recipes(lower(name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

-- RLS is enabled so direct anonymous database access cannot read/write rows.
-- The Express server uses the server-only service-role key after validating requests.
alter table public.recipes enable row level security;

drop policy if exists "No direct anonymous access to recipes" on public.recipes;
create policy "No direct anonymous access to recipes"
on public.recipes
for all
to anon
using (false)
with check (false);

-- Demo data. You can delete these rows and insert your own recipes later.
insert into public.recipes
(name, description, category, ingredients, steps, prep_time_minutes, cook_time_minutes, servings, emoji)
values
(
  'Vegetable Fried Rice',
  'A quick rice dish packed with colourful vegetables and simple seasonings.',
  'Lunch',
  '["2 cups cooked rice", "1 cup mixed vegetables", "1 tablespoon oil", "1 tablespoon soy sauce", "Salt to taste"]'::jsonb,
  '["Heat oil in a wide pan.", "Add the vegetables and cook until slightly tender.", "Add cooked rice and toss everything together.", "Add soy sauce and salt, then stir-fry for 2–3 minutes.", "Serve hot."]'::jsonb,
  10, 15, 2, '🍚'
),
(
  'Masala Omelette',
  'A simple Indian-style omelette with onion, tomato, chilli and coriander.',
  'Breakfast',
  '["2 eggs", "2 tablespoons chopped onion", "1 tablespoon chopped tomato", "1 green chilli", "1 tablespoon coriander", "Salt to taste"]'::jsonb,
  '["Crack the eggs into a bowl and whisk them.", "Mix in onion, tomato, chilli, coriander and salt.", "Heat a lightly oiled pan.", "Pour in the mixture and cook until the base sets.", "Flip carefully and cook the other side.", "Serve immediately."]'::jsonb,
  5, 7, 1, '🍳'
),
(
  'Tomato Pasta',
  'Comforting pasta with a fresh tomato sauce and herbs.',
  'Dinner',
  '["200 g pasta", "2 tomatoes", "1 tablespoon oil", "1 garlic clove", "1 teaspoon dried herbs", "Salt to taste"]'::jsonb,
  '["Boil pasta according to the packet instructions.", "Chop tomatoes and garlic.", "Heat oil and lightly cook the garlic.", "Add tomatoes, herbs and salt and simmer for 8 minutes.", "Add cooked pasta and mix well.", "Serve warm."]'::jsonb,
  10, 20, 2, '🍝'
),
(
  'Fruit Yogurt Bowl',
  'A no-cook snack made with yogurt, fruit and a little crunch.',
  'Snack',
  '["1 cup plain yogurt", "1 banana", "1 apple", "2 tablespoons oats", "1 teaspoon honey"]'::jsonb,
  '["Wash and chop the fruit.", "Add yogurt to a bowl.", "Top with fruit and oats.", "Drizzle with honey and serve."]'::jsonb,
  5, 0, 1, '🍓'
),
(
  'Chocolate Mug Cake',
  'A quick single-serving chocolate dessert prepared in a mug.',
  'Dessert',
  '["4 tablespoons flour", "2 tablespoons cocoa powder", "2 tablespoons sugar", "3 tablespoons milk", "1 tablespoon oil", "1/4 teaspoon baking powder"]'::jsonb,
  '["Mix flour, cocoa, sugar and baking powder in a microwave-safe mug.", "Add milk and oil and stir until smooth.", "Microwave until the cake is set, checking it carefully.", "Let it cool briefly before eating."]'::jsonb,
  5, 2, 1, '🍫'
)
on conflict do nothing;
