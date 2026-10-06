# Cadastro, reservas e painel — configurar para Vercel

Este pacote contém código de backend e frontend para um banco EXCLUSIVO desta pousada. Não substitui automaticamente a versão anterior na Vercel. Os sites privados do ChatGPT continuam na versão anterior. Não há tarifas ou quartos de exemplo cadastrados. Veja STATUS-BANCO.md para o estado de configuração.

## 1. Banco separado

Use um projeto Supabase NOVO e EXCLUSIVO para tico-pousada. Não use o projeto Summer. O schema.sql desta pasta cadastra somente esta pousada. Cada uma das outras cinco pastas precisa de seu próprio projeto e de suas próprias chaves.

No SQL Editor, execute o arquivo schema.sql UMA VEZ no novo projeto. Não repita o script em um banco já configurado. Em seguida, execute database-check.sql: ele faz testes de tarifas, disponibilidade, conflito de reservas e isolamento, e desfaz os dados de teste com ROLLBACK.

## 2. Administradores

No Supabase, abra Authentication → Users → Add user e crie um usuário com e-mail e senha para o responsável pela pousada. Confirme o usuário no painel. Não é necessário cadastro público de administradores.

Copie o UUID REAL desse usuário. No SQL Editor, execute, substituindo o UUID:

```sql
insert into public.hotel_admins(hotel_id,user_id)
values ('tico-pousada','COLE-O-UUID-REAL-DO-USUARIO');
```

Crie o administrador dentro do projeto exclusivo desta pousada. Os usuários e acessos dos outros projetos são independentes. Usuários não autorizados não acessam pedidos, mesmo que consigam autenticar.

## 3. Publicar cada pasta na Vercel

Envie a pasta COMPLETA da pousada para o GitHub: api/, lib/, public/, package.json, vercel.json e demais arquivos. Não envie somente public/. A pasta public/ contém a landing page, fotos e painel; api/ contém as funções de servidor.

Importe o repositório na Vercel. Framework: Other. Output Directory: public. Build Command e Install Command vazios. A configuração já está no vercel.json. Cada pasta é um projeto Vercel independente.

Se usar um único repositório contendo as seis pastas, crie seis projetos Vercel e escolha a pasta de cada pousada em Root Directory.

Na Vercel → Settings → Environment Variables, configure:

| Variável | Valor |
| --- | --- |
| SUPABASE_URL | URL do projeto Supabase NOVO |
| SUPABASE_PUBLISHABLE_KEY | Chave publishable do mesmo projeto |
| SUPABASE_SECRET_KEY | Chave secret do mesmo projeto, somente servidor |
| HOTEL_ID | ID da pousada correspondente à pasta |

Não coloque a chave secret no HTML, JavaScript público, GitHub ou mensagens. Copie-a diretamente do Supabase para as variáveis da Vercel. As APIs usam a chave no servidor; visitantes nunca recebem essa chave.

Faça Deploy ou Redeploy depois de configurar as variáveis.

IDs:
- refugio-das-rosas
- recanto-da-giovana
- casa-do-trem-suites
- lofts-e-suites-campos
- valence-village
- tico-pousada

## 4. Cadastrar a operação da pousada

Entre em https://SEU-DOMINIO/admin/ com o usuário autorizado.
1. Cadastre uma unidade por quarto físico, capacidade TOTAL (adultos + crianças) e tarifa-base por noite para aquela unidade.
2. Crie tarifas especiais por noite quando necessário. A estimativa soma todas as noites do período.
3. Bloqueie datas de reservas vindas de outros canais ou manutenção.
4. Configure o WhatsApp real da pousada. Três propriedades estão sem número confirmado; o botão será habilitado quando você cadastrar um número. O anúncio de hospedagem é a alternativa enquanto isso.
5. Faça um cadastro de teste pelo site e confira o pedido no painel.
6. Confirme apenas depois de combinar condições e pagamento com o hóspede. A confirmação bloqueia o quarto. Cancele o pedido de teste para liberar o período.

Sem quartos cadastrados, o site permite um pedido "sob consulta". Para confirmar esse pedido, vincule uma unidade no painel e depois confirme.

## Fluxo do visitante

Datas + ocupação → unidades disponíveis + estimativa → nome, telefone, e-mail opcional, observações e autorização para contato → pedido salvo no banco com protocolo → botão para continuar no WhatsApp.
O hóspede não precisa criar senha. Cadastro significa o registro do hóspede no pedido, não uma conta com login. O WhatsApp abre com mensagem pronta; o hóspede clica para enviá-la. Nenhum e-mail ou mensagem é disparado automaticamente nesta versão.

## Limites desta versão

- Reserva sob confirmação manual; não há cobrança, Pix automático ou gateway de cartão.
- Não há integração/sincronização com Booking, Airbnb ou PMS; bloqueie manualmente as reservas de outros canais antes de aceitar novas.
- Uma unidade por pedido. Solicitações de grupos maiores podem ser enviadas sob consulta.
- Capacidade considera todas as crianças como hóspedes. Não há política automática de gratuidade por idade.
- Tarifas em reais, por unidade/noite, sem cálculo de taxas extras. Combine eventuais adicionais no atendimento. A estimativa registrada no pedido não muda quando a tarifa do quarto é editada.
- O painel mostra os 1.000 pedidos mais recentes e atualiza a cada 60 segundos com a aba visível.
- A sessão administrativa fica apenas na memória da página, expira conforme o Supabase Auth e exige novo login após recarregar. Sem recuperação de senha no site; gerencie o usuário no Supabase.
- A pousada deve definir suas condições e o tratamento de dados antes do uso real. O cadastro informa a finalidade do contato e exige autorização.

## Verificação

12 testes automatizados de validação e API passaram com banco simulado; checagem de sintaxe, arquivos e links internos concluída. A integração com Supabase REAL e a trava SQL precisam ser verificadas após configurar o projeto, usando database-check.sql e um cadastro de teste. Não houve teste visual em navegador desta nova versão.

Para repetir os testes, com Node.js 22 ou superior:

```bash
npm test
```

Referências: https://vercel.com/docs/functions/runtimes/node-js e https://supabase.com/docs/guides/getting-started/api-keys
