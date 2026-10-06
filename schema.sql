-- Execute uma única vez em um projeto Supabase NOVO, exclusivo desta pousada.
-- Não execute no projeto Summer. Não há preços ou inventário fictícios.
begin;
create extension if not exists btree_gist with schema extensions;
set local search_path=public,extensions;
create table public.hotel_properties (id text primary key, name text not null, whatsapp text not null default '', active boolean not null default true);
create table public.hotel_admins (hotel_id text references public.hotel_properties(id), user_id uuid references auth.users(id), primary key(hotel_id,user_id));
create table public.hotel_rooms (id uuid primary key default gen_random_uuid(), hotel_id text not null references public.hotel_properties(id), name text not null check(length(name) between 2 and 120), description text not null default '', capacity integer not null check(capacity between 1 and 20), nightly_cents integer not null check(nightly_cents between 0 and 10000000), active boolean not null default true, created_at timestamptz not null default now(), unique(id,hotel_id));
create table public.hotel_rates (room_id uuid references public.hotel_rooms(id), day date not null, nightly_cents integer not null check(nightly_cents between 0 and 10000000), primary key(room_id,day));
create table public.hotel_requests (id uuid primary key default gen_random_uuid(), hotel_id text not null references public.hotel_properties(id), room_id uuid, name text not null check(length(name) between 2 and 120), phone text not null, email text not null default '', checkin date not null, checkout date not null, adults integer not null check(adults between 1 and 20), children integer not null check(children between 0 and 10), notes text not null default '', estimated_cents bigint, status text not null default 'pending' check(status in ('pending','confirmed','cancelled')), consent_at timestamptz not null default now(), created_at timestamptz not null default now(), idempotency uuid not null unique, foreign key(room_id,hotel_id) references public.hotel_rooms(id,hotel_id), check(checkout>checkin and checkout-checkin<=60));
create table public.hotel_bookings (id uuid primary key default gen_random_uuid(), hotel_id text not null references public.hotel_properties(id), room_id uuid not null, request_id uuid unique references public.hotel_requests(id), checkin date not null, checkout date not null, active boolean not null default true, reason text not null default 'Reserva', created_at timestamptz not null default now(), foreign key(room_id,hotel_id) references public.hotel_rooms(id,hotel_id), check(checkout>checkin), exclude using gist(room_id with =, daterange(checkin,checkout,'[)') with &&) where(active));
create table public.hotel_rate_limits (key text primary key, bucket timestamptz not null, hits integer not null);
create index on public.hotel_requests(hotel_id,created_at desc);
create index on public.hotel_rooms(hotel_id);
create index on public.hotel_bookings(hotel_id,checkin);
alter table public.hotel_properties enable row level security;
alter table public.hotel_admins enable row level security;
alter table public.hotel_rooms enable row level security;
alter table public.hotel_rates enable row level security;
alter table public.hotel_requests enable row level security;
alter table public.hotel_bookings enable row level security;
alter table public.hotel_rate_limits enable row level security;
-- Nenhuma tabela é acessível pelo cliente. A API verifica a identidade e a pousada.
revoke all on public.hotel_properties,public.hotel_admins,public.hotel_rooms,public.hotel_rates,public.hotel_requests,public.hotel_bookings,public.hotel_rate_limits from anon,authenticated;
grant all on public.hotel_properties,public.hotel_admins,public.hotel_rooms,public.hotel_rates,public.hotel_requests,public.hotel_bookings,public.hotel_rate_limits to service_role;
create function public.hotel_limit(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer; t timestamptz := date_trunc('hour',now());
begin
 delete from public.hotel_rate_limits where bucket<now()-interval '48 hours';
 insert into public.hotel_rate_limits as lim(key,bucket,hits) values(p_key,t,1)
 on conflict(key) do update set bucket=t,hits=case when lim.bucket=t then lim.hits+1 else 1 end returning hits into n;
 return n<=10;
end $$;
create function public.hotel_search(p_hotel text,p_in date,p_out date,p_guests integer) returns table(id uuid,name text,description text,capacity integer,total_cents bigint) language sql security invoker set search_path='' as $$
 select r.id,r.name,r.description,r.capacity,
 (select sum(coalesce(rate.nightly_cents,r.nightly_cents)) from generate_series(p_in::timestamp,(p_out-1)::timestamp,interval '1 day') d left join public.hotel_rates rate on rate.room_id=r.id and rate.day=d::date)::bigint
 from public.hotel_rooms r join public.hotel_properties h on h.id=r.hotel_id
 where h.active and r.hotel_id=p_hotel and r.active and r.capacity>=p_guests
 and p_out>p_in and p_out-p_in<=60
 and not exists(select 1 from public.hotel_bookings b where b.room_id=r.id and b.active and daterange(b.checkin,b.checkout,'[)') && daterange(p_in,p_out,'[)')) order by r.nightly_cents,r.name;
$$;
create function public.hotel_create_request(p_hotel text,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare room public.hotel_rooms; req public.hotel_requests; total bigint; existing public.hotel_requests;
begin
 select * into existing from public.hotel_requests where idempotency=(p_data->>'idempotency')::uuid;
 if found then
  if existing.hotel_id<>p_hotel or existing.phone<>(p_data->>'phone') or existing.name<>(p_data->>'name') or existing.checkin<>(p_data->>'checkin')::date or existing.checkout<>(p_data->>'checkout')::date then raise exception 'Idempotency conflict' using errcode='22023'; end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'estimated_cents',existing.estimated_cents);
 end if;
 if not exists(select 1 from public.hotel_properties where id=p_hotel and active) then raise exception 'Hotel unavailable' using errcode='22023'; end if;
 if (p_data->>'room_id') is not null then
  select * into room from public.hotel_rooms where id=(p_data->>'room_id')::uuid and hotel_id=p_hotel and active for update;
  if not found then raise exception 'Room unavailable' using errcode='22023'; end if;
  select s.total_cents into total from public.hotel_search(p_hotel,(p_data->>'checkin')::date,(p_data->>'checkout')::date,(p_data->>'adults')::integer+(p_data->>'children')::integer) s where s.id=room.id;
  if total is null then raise exception 'Room unavailable' using errcode='22023'; end if;
 end if;
 insert into public.hotel_requests(hotel_id,room_id,name,phone,email,checkin,checkout,adults,children,notes,estimated_cents,idempotency)
 values(p_hotel,room.id,p_data->>'name',p_data->>'phone',p_data->>'email',(p_data->>'checkin')::date,(p_data->>'checkout')::date,(p_data->>'adults')::integer,(p_data->>'children')::integer,p_data->>'notes',total,(p_data->>'idempotency')::uuid) returning * into req;
 return jsonb_build_object('id',req.id,'status',req.status,'estimated_cents',req.estimated_cents);
end $$;
create function public.hotel_confirm(p_hotel text,p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare req public.hotel_requests; r public.hotel_rooms;
begin
 select * into req from public.hotel_requests where id=p_id and hotel_id=p_hotel for update;
 if not found or req.status<>'pending' or req.room_id is null then raise exception 'Selecione um quarto e um pedido pendente.' using errcode='22023'; end if;
 select * into r from public.hotel_rooms where id=req.room_id and hotel_id=p_hotel and active for update;
 if not found or r.capacity<req.adults+req.children then raise exception 'Quarto indisponível ou capacidade insuficiente.' using errcode='22023'; end if;
 insert into public.hotel_bookings(hotel_id,room_id,request_id,checkin,checkout) values(p_hotel,req.room_id,req.id,req.checkin,req.checkout);
 update public.hotel_requests set status='confirmed' where id=req.id;
end $$;
create function public.hotel_cancel(p_hotel text,p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.hotel_requests where id=p_id and hotel_id=p_hotel for update;
 if not found then raise exception 'Pedido não encontrado.' using errcode='22023'; end if;
 update public.hotel_bookings set active=false where request_id=p_id and hotel_id=p_hotel;
 update public.hotel_requests set status='cancelled' where id=p_id and hotel_id=p_hotel;
end $$;
revoke execute on function public.hotel_limit(text),public.hotel_search(text,date,date,integer),public.hotel_create_request(text,jsonb),public.hotel_confirm(text,uuid),public.hotel_cancel(text,uuid) from public,anon,authenticated;
grant execute on function public.hotel_limit(text),public.hotel_search(text,date,date,integer),public.hotel_create_request(text,jsonb),public.hotel_confirm(text,uuid),public.hotel_cancel(text,uuid) to service_role;
insert into public.hotel_properties(id,name,whatsapp) values
 ('tico-pousada','Ti.co Pousada','5512996182586');
create policy block_client_access on public.hotel_properties for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_admins for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_rooms for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_rates for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_requests for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_bookings for all to anon, authenticated using (false) with check (false);
create policy block_client_access on public.hotel_rate_limits for all to anon, authenticated using (false) with check (false);

commit;
