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
  time timestamptz
);
