import {config,send,route,body,sameOrigin} from '../lib/server.js';
import {text} from '../lib/validation.js';
export default route(async(req,res)=>{
 if(req.method!=='POST')return send(res,405,{error:'Método inválido.'});sameOrigin(req);const c=config(),data=body(req);
 const r=await fetch(`${c.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:c.publicKey,'Content-Type':'application/json'},body:JSON.stringify({email:text(data.email,3,180),password:text(data.password,1,200)}),signal:AbortSignal.timeout(12000)});
 const session=await r.json();if(!r.ok)return send(res,401,{error:'Não foi possível entrar. Confira e-mail e senha ou aguarde alguns minutos.'});
 // O acesso ao painel é verificado em todas as chamadas de admin, no servidor.
 send(res,200,{access_token:session.access_token,expires_in:session.expires_in});
});
