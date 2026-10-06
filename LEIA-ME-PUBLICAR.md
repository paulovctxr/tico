# Tico: publicar a versão completa

1. Extraia este ZIP. O projeto está diretamente na raiz: api, lib, public, package.json e vercel.json.
2. Envie TODO o conteúdo extraído ao repositório do Tico. Use a opção de enviar arquivos e arraste as pastas inteiras, inclusive public/assets. Não envie o ZIP fechado nem somente o HTML.
3. Na Vercel, selecione Framework Other, Root Directory a pasta deste projeto, Output Directory public. Build Command e Install Command vazios. O vercel.json inclui essa configuração.
4. Configure SUPABASE_URL=https://deqeysqdxsdngorfqpxv.supabase.co, HOTEL_ID=tico-pousada, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY com as respectivas chaves desse mesmo banco. Copie as chaves diretamente para a Vercel; a secret nunca deve ficar no código público.
5. Faça Redeploy. Verifique que /assets/photo-3.jpg abre uma foto, /admin/ abre o painel e a pesquisa retorna acomodações ou permite pedido sob consulta.
6. Entre em /admin/ com seu usuário autorizado e cadastre quartos físicos, capacidade e tarifas reais. Configure também bloqueios de reservas vindas de outros canais. Veja CONFIGURAR.md para autorizar o administrador.

## Recursos incluídos

Calendário de dois meses com seleção de chegada e saída, adultos e crianças por acomodação, idades das crianças, até cinco acomodações, cupom para validação no atendimento, histórico de cinco buscas neste navegador, unidades disponíveis com valores estimados do período, detalhes, resumo, cadastro do hóspede, protocolo e WhatsApp. As cinco fotos estão em public/assets.

O grupo é gravado em uma transação. O painel mostra um pedido por acomodação; todos identificam o mesmo protocolo do grupo nas observações. Cada unidade é confirmada ou cancelada separadamente. O cadastro não bloqueia unidades; somente a confirmação administrativa bloqueia. Não existe pagamento online nesta versão. Cupons não alteram preços automaticamente. Idades não geram descontos automáticos. O calendário seleciona datas e não exibe tarifas diárias.

## Banco

A atualização group-reservations.sql já foi aplicada ao projeto exclusivo do Tico. NÃO repita schema.sql. Para uma instalação nova em outro projeto, execute schema.sql e depois group-reservations.sql. Nunca utilize o banco do Summer.

## Validação

14 testes de API/validação aprovados. Fluxo da interface verificado com DOM simulado: calendário, ocupação, escolha, duplicidade, total, cadastro, voltar e histórico. Não houve inspeção visual desta atualização no navegador. Testes transacionais no banco real aprovados, sem manter dados de teste. A publicação na sua Vercel depende da atualização do repositório e das variáveis de ambiente.
