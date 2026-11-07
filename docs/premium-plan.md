# Plano Premium — A.S MUSIC ANGOLA

## Oferta comercial aprovada
- Preço: **5.000 Kz (AOA)**.
- Duração: **30 dias** contados a partir da confirmação do pagamento.
- Pagamento antecipado.
- Sem período experimental.
- Renovação manual; não há débito automático.
- Serviços individuais são vendidos separadamente e os preços ficam por definir.

## Vantagens disponíveis no produto
1. Selo de estado Premium na área pessoal do artista.
2. Chat individual e privado com a administração para suporte e comprovativos.
3. Histórico de pedidos e estado dos pagamentos.
4. Estatísticas de carreira: total de faixas, aprovadas, pendentes e rejeitadas.\n5. Acompanhamento das submissões e histórico de pedidos.\n6. Renovação sem perda dos dias ainda activos: a nova subscrição começa no fim do período em vigor.\n5. Prioridade na fila interna de revisão das faixas submetidas enquanto a subscrição estiver activa (não garante aprovação nem publicação).

Não anunciar publicação garantida, distribuição em lojas, royalties, downloads ilimitados, destaque garantido ou aprovação automática como vantagem Premium. Esses itens dependem de contratos, direitos, inventário e funcionalidades adicionais que ainda não estão activos.

## Activação da conta
A subscrição é criada por um trigger PostgreSQL apenas quando uma ordem Premium de 5.000 AOA muda para `paid` por um backend de confiança. O trigger:
- activa 30 dias;
- estende a partir do fim do período activo anterior quando há renovação;
- não duplica uma ordem já processada;
- actualiza o estado do chat ligado ao pedido.

A aplicação considera a subscrição activa apenas enquanto o estado é active e ends_at é posterior ao momento actual. Ao passar da data, as vantagens deixam de ser concedidas automaticamente, a conta regressa ao plano normal e o perfil/histórico do artista são preservados. Não é necessária uma acção manual do administrador.\n\nO cliente não tem permissões para marcar um pedido como pago. Para transferência bancária manual, só o administrador principal pode confirmar depois de verificar o crédito na conta. A confirmação dispara a mesma activação automática.

## Conta de recebimento pessoal e aprovação

O administrador principal declarou que possui apenas uma conta bancária pessoal comum, sem actividade comercial registada em nome individual. A plataforma está preparada para preencher o nome pessoal do titular e os dados bancários, mas não apresenta nem aceita pagamentos enquanto não houver confirmação escrita do banco e do prestador sobre a utilização comercial dessa conta. A lista de canais aprovados permanece vazia por defeito. A aprovação de um método não implica aprovação automática dos restantes.

## Pagamentos e fornecedor
Fornecedor recomendado: **AppyPay**, sujeito a onboarding e contrato. A AppyPay publica suporte para GPO/Multicaixa Express, Referência e UNITEL Money. A elegibilidade da conta pessoal comum ainda está sob consulta por escrito. Não presumir que uma conta pessoal é aceite como conta de comerciante; confirmar os requisitos de enquadramento, titularidade e aprovação do banco de apoio antes de qualquer activação.

Fontes:
- https://www.appypay.co.ao/api-info
- https://www.appypay.co.ao/termos-de-utilizacao
- https://suporte-appypay.freshdesk.com/support/solutions/articles/501000417474-como-obter-as-credenciais-de-integrac%C3%A3o-client-id-client-secret-api-keys-e-resource-id
- https://suporte-appypay.freshdesk.com/support/solutions/articles/501000385502-criar-uma-cobranca-charge-na-api-appypay-gpo-e-refer%C3%AAncia
- https://suporte-appypay.freshdesk.com/support/solutions/articles/501000385505-como-validar-a-assinatura-do-webhook

### Credenciais necessárias (não inserir no código)
- Client ID e Client Secret OAuth2.
- API Key para GPO e/ou REF.
- Resource ID do ambiente.
- Credenciais distintas de Sandbox e Produção.
- Acesso a consulta GET /charges/{id} e webhook configurado no portal.\n- Segredo server-side `APPYPAY_ACCESS_TOKEN` para a função webhook (até estar implementada a renovação OAuth2 automática); nunca guardar este token em tabelas ou no frontend.

Guardar credenciais exclusivamente em Supabase Edge Function Secrets. Nunca no frontend, GitHub, chat, tabela de instruções ou ficheiros públicos.

### Estado da integração
- Edge Function de criação de pedido preparada para métodos habilitados; actualmente regista pedido como revisão manual.
- Endpoint AppyPay webhook preparado para validar o estado por GET /charges/{id} e só aceitar exactamente 5.000 AOA para o merchantTransactionId correspondente.
- Ainda falta implementar a criação real de charge e a autenticação OAuth2 com as credenciais comerciais reais, validar os payloads com a conta Sandbox e testar GPO/REF.
- Até estes passos estarem concluídos, não activar Multicaixa Express/Referência/UNITEL Money como pagamento automático. Transferência bancária manual exige verificação humana.
- Nenhum segredo ou contrato está incluído neste repositório.

## Publicação
As migrations e Edge Functions deste branch ainda precisam de revisão, execução em ambiente de teste, aplicação controlada no Supabase e deploy das funções. O PR não está merged e nada aqui deve ser interpretado como já activo em produção.
