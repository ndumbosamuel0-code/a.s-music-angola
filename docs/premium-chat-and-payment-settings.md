# Premium 5.000 Kz, métodos de pagamento e chat individual

## Decisão comercial
- Premium mensal: **5.000 AOA (Kz)** em todos os métodos.
- Duração: 30 dias a partir da libertação pelo administrador principal.
- Sem trial e sem activação antes do pagamento.
- Renovação manual: sem débito automático.

## Situação da conta de recebimento — conta pessoal comum

O administrador principal informou que, neste momento, dispõe apenas de uma conta bancária pessoal comum, sem actividade comercial registada em nome individual nem sociedade constituída. Por isso:

- Os campos permitem guardar o nome do titular pessoal, banco, IBAN e número de conta para preparação.
- Guardar os dados não significa que o banco autorize recebimentos comerciais nessa conta.
- Todos os métodos permanecem desactivados e a activação está bloqueada na interface até existir confirmação escrita do banco e, quando aplicável, da AppyPay.
- Multicaixa Express, referência e UNITEL Money não devem ser activados sem aprovação específica do banco/prestador.
- Transferências manuais só poderão ser aceites depois de o banco confirmar que a conta pode receber pagamentos de clientes para esta actividade.

## Preparado nesta migração
- Fixa o item `premium_monthly` em 5.000 AOA.
- Cria configuração de instruções de recebimento por método, editável pelo administrador principal. Começa desactivada e vazia para que sejam inseridos os dados reais.
- Cria estrutura de chat individual por utilizador, mensagens e anexos de comprovativo.
- Cria bucket privado `billing-proofs` com limite 5 MB e tipos JPEG, PNG e PDF.
- Adiciona RPC `release_premium_access`: apenas o administrador principal pode libertar 30 dias, apenas para pedido Premium pago e confirmado; operação idempotente.
- Utilizadores só consultam as suas conversas/pedidos; não podem declarar pagamento confirmado.

## Limite essencial da verificação automática
Um comprovativo (imagem/PDF) não prova automaticamente que o dinheiro entrou. A verificação automática só pode ser fiável quando a AppyPay/EMIS/fornecedor fornecer um checkout/API e notificação server-to-server autenticada. A mensagem do chat pode mostrar o estado do pedido (pendente, em verificação, pago, falhado/expirado), mas o estado `paid` deve ser escrito exclusivamente por Edge Function após validar assinatura, referência, valor exacto 5.000 AOA e estado junto do fornecedor. Com transferência manual e apenas fotografia, fica `needs_review` até o administrador confirmar no banco.

## Ainda necessário antes de produção
1. Aplicar esta migração apenas depois de revisão e backup.
2. Criar UI de administração para editar instruções de cada método, e UI de chat no painel do artista e do administrador.
3. Implementar Edge Functions AppyPay para criar cobrança e verificar notificações/estado; nunca guardar segredos no browser.
4. Implementar a apresentação do botão “Libertar Premium por 1 mês” apenas no chat/admin quando a ordem estiver `paid`; chamar RPC acima.
5. Fazer testes de segurança, upload, permissões, repetição de webhook, valor/moeda incorrectos e ciclo completo sandbox.

Nenhum método é activado automaticamente nesta migração. A lista de métodos autorizados no código está vazia até serem recebidas e verificadas as aprovações escritas do banco e do fornecedor.
