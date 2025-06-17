-- Table storing waypoint markers
create table if not exists waypoints (
  id serial primary key,
  km numeric,
  name text,
  lat numeric,
  lng numeric,
  is_ravito boolean default false
);

-- Table storing GPX trackpoints for each file
create table if not exists trackpoints (
  id bigserial primary key,
  gpx_filename text not null,
  lat numeric,
  lng numeric,
  elevation numeric,
  time timestamptz,
  step_id integer references steps(id)
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
  gpx_file_key text not null,
  created_at timestamptz default now()
);
