export class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function saoPauloToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw new AppError('Data inválida.');return v;}
export function dates(data){const checkin=date(data.checkin),checkout=date(data.checkout);const nights=(Date.parse(checkout)-Date.parse(checkin))/86400000;if(checkin<saoPauloToday()||nights<1||nights>60)throw new AppError('Escolha datas futuras e uma estadia de 1 a 60 noites.');return {checkin,checkout,nights};}
export function integer(value,min,max){const n=Number(value);if(value===''||value===null||typeof value==='boolean'||!Number.isInteger(n)||n<min||n>max)throw new AppError('Quantidade inválida.');return n;}
export function text(value,min,max){if(typeof value!=='string')throw new AppError('Campo inválido.');const s=value.trim();if(s.length<min||s.length>max)throw new AppError(`Preencha o campo com ${min} a ${max} caracteres.`);return s;}
export const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function requestData(data){const {checkin,checkout}=dates(data);if(data.consent!==true||data.website)throw new AppError('Confirme a autorização para contato.');const phone=text(data.phone,8,24).replace(/\D/g,'');if(phone.length<10||phone.length>15)throw new AppError('Informe um telefone com DDD.');const email=text(data.email??'',0,180);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new AppError('E-mail inválido.');if(!uuid(data.idempotency)||data.room_id&&!uuid(data.room_id))throw new AppError('Identificador inválido.');return {name:text(data.name,2,120),phone,email,checkin,checkout,adults:integer(data.adults,1,20),children:integer(data.children,0,10),notes:text(data.notes??'',0,1000),room_id:data.room_id||null,idempotency:data.idempotency};}
export function groupData(data){
 if(!Array.isArray(data.units)||data.units.length<1||data.units.length>5)throw new AppError('Escolha de 1 a 5 acomodações.');
 const coupon=text(data.coupon??'',0,40).toUpperCase();const seen=new Set();
 const units=data.units.map(u=>{
  const adults=integer(u.adults,1,20),children=integer(u.children,0,10);
  if(!Array.isArray(u.ages)||u.ages.length!==children)throw new AppError('Informe a idade de cada criança.');
  const ages=u.ages.map(v=>integer(v,0,17));
  if(u.room_id&&!uuid(u.room_id))throw new AppError('Acomodação inválida.');
  if(u.room_id&&seen.has(u.room_id))throw new AppError('Selecione quartos diferentes para cada acomodação.');
  if(u.room_id)seen.add(u.room_id);
  return {adults,children,ages,room_id:u.room_id||null};
 });
 const base=requestData({...data,adults:units[0].adults,children:units[0].children,room_id:units[0].room_id,notes:text(data.notes??'',0,500)});
 return {...base,units,coupon};
}
