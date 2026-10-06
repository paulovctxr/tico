import {config,send,route,body,sameOrigin,admin,db,rpc} from '../lib/server.js';
import {AppError,integer,text,uuid,dates} from '../lib/validation.js';
export default route(async(req,res)=>{
 const c=config();await admin(req);const scope=`hotel_id=eq.${encodeURIComponent(c.hotel)}`;
 if(req.method==='GET'){
  const [rooms,requests,bookings,properties]=await Promise.all([db(`hotel_rooms?${scope}&order=created_at&select=*`),db(`hotel_requests?${scope}&order=created_at.desc&limit=1000&select=*`),db(`hotel_bookings?${scope}&active=eq.true&order=checkin&select=*`),db(`hotel_properties?id=eq.${encodeURIComponent(c.hotel)}&select=*`)]);return send(res,200,{rooms,requests,bookings,property:properties[0]});
 }
 if(req.method!=='POST')return send(res,405,{error:'Método inválido.'});sameOrigin(req);const d=body(req);
 if(d.action==='room'){
  const room={hotel_id:c.hotel,name:text(d.name,2,120),description:text(d.description??'',0,1000),capacity:integer(d.capacity,1,20),nightly_cents:integer(d.nightly_cents,0,10000000),active:d.active===true};
  if(d.id){if(!uuid(d.id))throw new AppError('Quarto inválido.');await db(`hotel_rooms?${scope}&id=eq.${d.id}`,{method:'PATCH',body:JSON.stringify(room)});}else await db('hotel_rooms',{method:'POST',body:JSON.stringify(room)});
 }else if(d.action==='confirm'||d.action==='cancel'){
  if(!uuid(d.id))throw new AppError('Pedido inválido.');await rpc(d.action==='confirm'?'hotel_confirm':'hotel_cancel',{p_hotel:c.hotel,p_id:d.id});
 }else if(d.action==='assign'){
  if(!uuid(d.id)||!uuid(d.room_id))throw new AppError('Quarto inválido.');
  const rooms=await db(`hotel_rooms?${scope}&id=eq.${d.room_id}&select=id`);if(!rooms.length)throw new AppError('Quarto inválido.');
  await db(`hotel_requests?${scope}&id=eq.${d.id}&status=eq.pending`,{method:'PATCH',body:JSON.stringify({room_id:d.room_id})});
 }else if(d.action==='rate'){
  if(!uuid(d.room_id)||!/^\d{4}-\d{2}-\d{2}$/.test(d.day||'')||Number.isNaN(Date.parse(d.day))||new Date(d.day).toISOString().slice(0,10)!==d.day)throw new AppError('Data inválida.');
  const rooms=await db(`hotel_rooms?${scope}&id=eq.${d.room_id}&select=id`);if(!rooms.length)throw new AppError('Quarto inválido.');
  await db('hotel_rates?on_conflict=room_id,day',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({room_id:d.room_id,day:d.day,nightly_cents:integer(d.nightly_cents,0,10000000)})});
 }else if(d.action==='block'){
  if(!uuid(d.room_id))throw new AppError('Quarto inválido.');const rooms=await db(`hotel_rooms?${scope}&id=eq.${d.room_id}&select=id`);if(!rooms.length)throw new AppError('Quarto inválido.');const period=dates(d);
  await db('hotel_bookings',{method:'POST',body:JSON.stringify({hotel_id:c.hotel,room_id:d.room_id,checkin:period.checkin,checkout:period.checkout,reason:text(d.reason||'Bloqueio manual',2,200)})});
 }else if(d.action==='unblock'){
  if(!uuid(d.id))throw new AppError('Bloqueio inválido.');await db(`hotel_bookings?${scope}&id=eq.${d.id}&request_id=is.null`,{method:'PATCH',body:JSON.stringify({active:false})});
 }else if(d.action==='property'){
  const whatsapp=text(d.whatsapp??'',0,20).replace(/\D/g,'');if(whatsapp&&!/^\d{10,15}$/.test(whatsapp))throw new AppError('WhatsApp inválido.');
  await db(`hotel_properties?id=eq.${encodeURIComponent(c.hotel)}`,{method:'PATCH',body:JSON.stringify({whatsapp})});
 }else throw new AppError('Ação inválida.');
 send(res,200,{ok:true});
});
