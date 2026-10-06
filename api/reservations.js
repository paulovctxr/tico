import {config,send,route,body,sameOrigin,limit,db,rpc} from '../lib/server.js';
import {dates,integer,requestData,groupData} from '../lib/validation.js';
export default route(async(req,res)=>{
 const c=config();
 if(req.method==='GET'){
  const {checkin,checkout}=dates(req.query);const guests=integer(req.query.guests,1,30);
  const properties=await db(`hotel_properties?id=eq.${encodeURIComponent(c.hotel)}&active=eq.true&select=name,whatsapp`);if(!properties.length)return send(res,404,{error:'Pousada indisponível.'});
  const rooms=await rpc('hotel_search',{p_hotel:c.hotel,p_in:checkin,p_out:checkout,p_guests:guests});return send(res,200,{rooms,property:properties[0]});
 }
 if(req.method==='POST'){
  sameOrigin(req);const input=body(req);const grouped=Array.isArray(input.units);const data=grouped?groupData(input):requestData(input);await limit(req);
  const result=await rpc(grouped?'hotel_create_group_request':'hotel_create_request',{p_hotel:c.hotel,p_data:data});
  const [property]=await db(`hotel_properties?id=eq.${encodeURIComponent(c.hotel)}&select=name,whatsapp`);
  return send(res,201,{...result,property});
 }
 res.setHeader('Allow','GET, POST');send(res,405,{error:'Método inválido.'});
});
