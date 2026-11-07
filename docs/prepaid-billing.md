# Cobranças Premium e serviços — A.S MUSIC ANGOLA

## Decisões aprovadas

- Premium mensal e serviços individuais.
- Sem período experimental.
- Pagamento antecipado obrigatório antes da activação/execução.
- Moeda de referência: AOA (Kz).
- Métodos pretendidos: Multicaixa Express e pagamento por referência; UNITEL Money apenas se habilitado pelo gateway.
- Sem renovação automática: o artista paga novamente para prolongar o Premium.

## O que esta preparação implementa

A migração `billing_catalog` prepara os produtos, mas deixa todos inactivos e sem preço até a administração definir os valores.
`billing_payment_orders` guarda pedidos e estados de pagamento; o utilizador só lê os seus próprios pedidos.
`artist_premium_subscriptions` representa períodos de 30 dias criados depois da confirmação.
`billing_webhook_events` impede processar duas vezes o mesmo evento do fornecedor.

Os clientes não podem inserir, alterar, aprovar ou marcar pedidos como pagos. Essas operações pertencem exclusivamente ao backend com credenciais secretas. Não se guarda número de cartão, PIN, palavra-passe Multicaixa ou credenciais bancárias.

## Ainda não ligado

Não existe nesta alteração chamada real à AppyPay, checkout, webhook público, nem activação de Premium. Não activar as tabelas em produção antes de backup/revisão. O fornecedor tem de confirmar contrato, credenciais de sandbox/produção, formato de checkout, assinatura/autenticação de webhook, métodos habilitados, liquidação e taxas.

## Próximas etapas para produção

1. Definir preços AOA para Premium mensal e cada serviço.
2. Concluir onboarding comercial AppyPay e obter credenciais de sandbox.
3. Implementar Edge Functions server-side: criar checkout autenticado, receber webhook autenticado/verificado e consultar estado com o fornecedor.
4. Fazer testes sandbox: pagamento aprovado, recusado, expirado, repetição de webhook, valor/moeda divergentes e tentativa de acesso de outro utilizador.
5. Rever RLS, aplicar migração com backup, configurar secrets no Supabase e só então activar catálogo e publicar.

## Regra de confirmação

Nunca confiar no redireccionamento do browser, no botão “já paguei” ou num comprovativo enviado pelo artista como prova final. Só um evento autenticado e validado no backend pode marcar o pedido como pago. A confirmação deve validar ID do pedido, montante, moeda, estado e referência junto do fornecedor.
