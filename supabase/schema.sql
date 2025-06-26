-- Table storing waypoint markers
create table if not exists waypoints (
  id serial primary key,
  km numeric,
  name text,
  lat numeric,
  lng numeric,
  is_ravito boolean default false
);

-- Table storing GPX trackpoints
create table if not exists trackpoints (
  id bigserial primary key,
  lat numeric,
  lng numeric,
  elevation numeric,
  time timestamptz,
  distance_km numeric default 0
);

-- Table storing step information
create table if not exists steps (
  id serial primary key,
  start_lat numeric not null,
  start_lng numeric not null,
  end_lat numeric not null,
  end_lng numeric not null,
  departure_time timestamptz,
  distance_km numeric,
  elevation_gain_m numeric,
  estimated_duration_minutes integer,
  created_at timestamptz default now()
);

-- Table storing live tracking configuration
create table if not exists live_track_config (
  id serial primary key,
  live_track_url text,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert a default configuration row
insert into live_track_config (live_track_url, is_active) 
values (null, false) 
on conflict do nothing;
