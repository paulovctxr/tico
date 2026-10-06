import {test} from 'node:test';import assert from 'node:assert/strict';
import {dates,requestData,integer} from '../lib/validation.js';
const base={name:'Pessoa Teste',phone:'(12) 99999-9999',email:'teste@example.com',checkin:'2099-01-01',checkout:'2099-01-03',adults:2,children:0,consent:true,idempotency:'00000000-0000-4000-8000-000000000001'};
test('cadastro sanitiza telefone e ignora preço fornecido pelo cliente',()=>{const d=requestData({...base,estimated_cents:1,status:'confirmed'});assert.equal(d.phone,'12999999999');assert.equal(d.status,undefined);assert.equal(d.estimated_cents,undefined);});
test('não aceita consentimento ausente nem honeypot preenchido',()=>{assert.throws(()=>requestData({...base,consent:false}));assert.throws(()=>requestData({...base,website:'spam'}));});
test('valida datas, ano bissexto e limite de estadia',()=>{assert.equal(dates(base).nights,2);for(const d of [{checkin:'2099-02-29',checkout:'2099-03-02'},{checkin:'2099-01-02',checkout:'2099-01-01'},{checkin:'2099-01-01',checkout:'2099-04-01'},{checkin:'2000-01-01',checkout:'2000-01-02'}])assert.throws(()=>dates(d));});
test('não aceita telefone inválido, UUID ou e-mail inválidos',()=>{for(const d of [{phone:'123'},{email:'invalido'},{idempotency:'x'},{room_id:'other-hotel'}])assert.throws(()=>requestData({...base,...d}));});
test('quantidades não aceitam bool, vazio ou frações',()=>{for(const x of ['',null,true,2.5,-1,21])assert.throws(()=>integer(x,1,20));assert.equal(integer('2',1,20),2);});
