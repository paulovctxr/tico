# Configuração atual do Tico

Leia primeiro LEIA-ME-PUBLICAR.md e STATUS-BANCO.md. O banco exclusivo já está configurado; não execute schema.sql novamente.

## Autorizar o administrador

No Supabase do Tico, em Authentication → Users → Add user, crie o responsável com e-mail e senha e confirme o e-mail. Copie o UUID desse usuário e execute no SQL Editor:

```sql
insert into public.hotel_admins(hotel_id,user_id)
values ('tico-pousada','COLE-O-UUID-REAL-DO-USUARIO')
on conflict do nothing;
```

Entre no seu domínio em /admin/. Cadastre uma unidade por quarto físico, capacidade total, tarifa por noite e bloqueios de datas. Todas as crianças contam na capacidade; as idades ficam nas observações para atendimento. Os pedidos de várias acomodações aparecem em cartões separados, vinculados pelo protocolo de grupo nas observações. Confirme cada quarto após combinar disponibilidade e condições.

## Variáveis na Vercel

SUPABASE_URL=https://deqeysqdxsdngorfqpxv.supabase.co
HOTEL_ID=tico-pousada
SUPABASE_PUBLISHABLE_KEY=chave publishable do projeto
SUPABASE_SECRET_KEY=chave secret do projeto (somente servidor)

Faça Redeploy após salvar as variáveis. Cupons são enviados para validação manual, sem desconto automático. Não há cobrança ou integração de inventário com Airbnb/Booking.
