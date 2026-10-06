-- Atualização não destrutiva para o banco exclusivo do Tico já configurado.
create or replace function public.hotel_create_group_request(p_hotel text,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 u jsonb; item jsonb; result jsonb; records jsonb := '[]'::jsonb;
 token uuid; unit_token uuid; fingerprint text; idx integer := 0; n integer;
 existing public.hotel_requests; note text;
begin
 n:=jsonb_array_length(p_data->'units');
 if n is null or n<1 or n>5 then raise exception 'Invalid group' using errcode='22023'; end if;
 token:=(p_data->>'idempotency')::uuid;
 fingerprint:=md5((p_data-'consent'-'website')::text);
 -- Serialize retries for this group; all unit inserts share one transaction.
 perform pg_advisory_xact_lock(hashtextextended(token::text,0));
 if (select count(*) from jsonb_array_elements(p_data->'units') x where x->>'room_id' is not null) <>
    (select count(distinct x->>'room_id') from jsonb_array_elements(p_data->'units') x where x->>'room_id' is not null)
 then raise exception 'Duplicate rooms' using errcode='22023'; end if;
 -- Stable room lock order also protects concurrent confirmations.
 perform 1 from public.hotel_rooms where hotel_id=p_hotel and id in
 (select (x->>'room_id')::uuid from jsonb_array_elements(p_data->'units') x where x->>'room_id' is not null) order by id for update;
 for u in select value from jsonb_array_elements(p_data->'units') loop
  idx:=idx+1;
  unit_token:=case when idx=1 then token else md5(token::text||':'||idx::text)::uuid end;
  note:='Grupo '||token::text||' | Acomodação '||idx::text||'/'||n::text||E'\n'||
  'Idades das crianças: '||coalesce((u->'ages')::text,'[]')||E'\n'||
  case when coalesce(p_data->>'coupon','')<>'' then 'Cupom para validação (sem desconto automático): '||(p_data->>'coupon')||E'\n' else '' end||
  coalesce(p_data->>'notes','')||E'\n'||'Controle do pedido: '||fingerprint;
  select * into existing from public.hotel_requests where idempotency=unit_token;
  if found and (existing.hotel_id<>p_hotel or existing.notes<>note) then raise exception 'Idempotency conflict' using errcode='22023'; end if;
  item:=(p_data-'units'-'coupon')||jsonb_build_object('adults',u->'adults','children',u->'children','room_id',u->'room_id','notes',note,'idempotency',unit_token);
  result:=public.hotel_create_request(p_hotel,item);
  records:=records||jsonb_build_array(result);
 end loop;
 return jsonb_build_object('id',token,'status','pending','requests',records);
end $$;
revoke execute on function public.hotel_create_group_request(text,jsonb) from public,anon,authenticated;
grant execute on function public.hotel_create_group_request(text,jsonb) to service_role;
