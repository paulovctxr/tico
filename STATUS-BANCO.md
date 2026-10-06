# Banco exclusivo do Tico

Projeto: pousada-tico-pousada
ID: deqeysqdxsdngorfqpxv
URL: https://deqeysqdxsdngorfqpxv.supabase.co
HOTEL_ID: tico-pousada

O banco e a atualização para pedidos com até cinco acomodações foram configurados. Não execute schema.sql novamente neste projeto. group-reservations.sql já foi aplicado.

Ainda não há quartos ou tarifas cadastrados. Cadastre as unidades reais no painel para mostrar disponibilidade e preços. A pousada pode receber pedidos sob consulta enquanto isso.

A publicação anterior na Vercel não recebe automaticamente este código. Publique este pacote completo e configure as quatro variáveis de ambiente. O acesso administrativo depende de um usuário do Supabase Auth autorizado na tabela hotel_admins.

Testes de grupo no banco real passaram com ROLLBACK: preços calculados no servidor, reenvio sem duplicar, rejeição de alterações no mesmo protocolo, quartos repetidos, capacidade, gravação atômica e restrição de acesso. Nenhum dado de teste foi mantido.
