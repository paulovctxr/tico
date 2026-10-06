-- Execute depois de schema.sql, no SQL Editor do projeto NOVO.
-- Testa consulta, confirmação, conflito e liberação. Tudo é revertido no final.
begin;
do $$
declare r1 uuid; r2 uuid; req1 jsonb; req2 jsonb; n integer;
begin
 insert into public.hotel_rooms(hotel_id,name,capacity,nightly_cents) values('tico-pousada','Unidade temporária de teste',2,12345) returning id into r1;
 insert into public.hotel_rates(room_id,day,nightly_cents) values(r1,'2099-01-01',20000);
 if (select total_cents from public.hotel_search('tico-pousada','2099-01-01','2099-01-03',2) where id=r1)<>32345 then raise exception 'Falha no cálculo de tarifa'; end if;
 select public.hotel_create_request('tico-pousada',jsonb_build_object('name','Teste SQL','phone','12999999999','email','','checkin','2099-01-01','checkout','2099-01-03','adults',2,'children',0,'notes','','room_id',r1,'idempotency',gen_random_uuid())) into req1;
 select public.hotel_create_request('tico-pousada',jsonb_build_object('name','Outro Teste','phone','12999999998','email','','checkin','2099-01-02','checkout','2099-01-04','adults',2,'children',0,'notes','','room_id',r1,'idempotency',gen_random_uuid())) into req2;
 perform public.hotel_confirm('tico-pousada',(req1->>'id')::uuid);
 begin
  perform public.hotel_confirm('tico-pousada',(req2->>'id')::uuid);
  raise exception 'Falha: aceitou reserva sobreposta';
 exception when exclusion_violation then null;
 end;
 if exists(select 1 from public.hotel_search('tico-pousada','2099-01-01','2099-01-03',2) where id=r1) then raise exception 'Falha: quarto ocupado apareceu disponível'; end if;
 if not exists(select 1 from public.hotel_search('tico-pousada','2099-01-03','2099-01-04',2) where id=r1) then raise exception 'Falha: períodos adjacentes foram bloqueados'; end if;
 perform public.hotel_cancel('tico-pousada',(req1->>'id')::uuid);
 perform public.hotel_confirm('tico-pousada',(req2->>'id')::uuid);
 if exists(select 1 from public.hotel_search('outra-pousada-nao-cadastrada','2099-01-01','2099-01-03',2) where id=r1) then raise exception 'Falha: isolamento entre pousadas'; end if;
 if has_table_privilege('anon','public.hotel_requests','SELECT') or has_function_privilege('anon','public.hotel_create_request(text,jsonb)','EXECUTE') then raise exception 'Falha: acesso público a dados privados'; end if;
 raise notice 'OK: tarifas, disponibilidade, conflito, cancelamento e isolamento';
end $$;
rollback;
