# Preparação da distribuição digital — A.S MUSIC ANGOLA

## Estado confirmado

- O projeto usa Supabase no projeto `hvwubckihjuljlhgaial`.
- Existem tabelas de artistas, faixas, licenças, utilizadores, funções de pagamento e candidaturas de distribuidoras.
- Os ficheiros de áudio e documentos de licenças estão em armazenamento privado.
- Não existem Edge Functions de distribuição instaladas neste momento.
- A tabela `tracks` usa estados internos `pending`, `approved`, `rejected` e `removed`.
- A plataforma ainda não tem credenciais de API nem confirmação de contrato de distribuição.

## Decisão técnica recomendada

Implementar a integração como uma camada server-side independente do frontend. O navegador nunca deve comunicar diretamente com a API do parceiro nem receber tokens, client secrets ou service-role keys.

### Fluxo proposto

1. O artista submete áudio, capa, metadados, créditos e confirmação dos direitos.
2. A equipa administrativa verifica a faixa e a licença/documentação.
3. A aprovação interna não significa envio automático: a faixa só entra na fila externa quando o administrador a marcar para distribuição.
4. O servidor valida novamente o utilizador, o papel de administrador, o estado aprovado, a licença válida e os metadados obrigatórios.
5. O servidor cria um trabalho de distribuição idempotente e envia o lançamento ao parceiro.
6. O parceiro devolve um identificador de lançamento e estados por DSP.
7. Webhooks autenticados atualizam cada DSP; uma rotina de reconciliação consulta trabalhos que ficaram sem atualização.
8. O artista vê o estado por loja, erros corrigíveis e histórico. Não vê tokens nem dados internos do parceiro.

## Estados a suportar

- Internos: `pending_review`, `needs_changes`, `approved`, `rejected`, `rights_blocked`.
- Distribuição: `queued`, `submitting`, `submitted`, `processing`, `delivered`, `partially_delivered`, `failed`, `withdrawal_requested`, `withdrawn`.
- Estado por DSP: `pending`, `processing`, `live`, `rejected`, `takedown_pending`, `taken_down`, `unknown`.

Os estados externos devem guardar também o código/mensagem original do parceiro, timestamp da última atualização e identificador externo. Não transformar um estado desconhecido em sucesso.

## Estrutura de dados a criar numa migração versionada

A implementação deverá criar tabelas separadas, sem substituir nem reescrever as tabelas existentes:

- `distribution_partners`: nome, estado de configuração, ambiente (sandbox/produção), capacidades e lista de DSPs contratadas. Sem guardar segredos nesta tabela.
- `distribution_releases`: faixa, parceiro, identificador externo, estado global, idempotency key, tentativas, último erro e timestamps.
- `distribution_release_stores`: lançamento, código DSP, estado por DSP, URL pública quando fornecida pelo parceiro, erro e timestamp.
- `distribution_events`: eventos/webhooks recebidos, identificador único do evento, payload minimizado e data de processamento. Não guardar credenciais ou dados pessoais desnecessários.
- `distribution_audit_log`: ator, ação, lançamento, data e metadados mínimos para auditoria.

Todas as tabelas devem ter RLS ativa. Artistas só podem consultar lançamentos ligados às próprias faixas; distribuidores só os lançamentos atribuídos à sua conta, se esse papel for usado; administrador principal pode gerir e consultar tudo. Escritas de estados externos devem ocorrer apenas por funções server-side com validação de assinatura e autorização.

## Edge Functions previstas

1. `distribution-submit`: JWT obrigatório; confirmar utilizador e papel de administrador; verificar faixa aprovada, licença verificada e direitos; enviar para o parceiro usando segredos server-side; nunca aceitar do cliente o estado final ou o ID externo.
2. `distribution-webhook`: endpoint sem JWT de utilizador apenas se o parceiro exigir webhooks públicos; validar assinatura HMAC/token do parceiro antes de aceitar qualquer evento; rejeitar eventos repetidos.
3. `distribution-reconcile`: execução protegida por segredo de cron; consultar estados pendentes e corrigir eventos perdidos.

As funções não devem ser implementadas com permissões abertas. A função de webhook não pode confiar em payload sem assinatura validada. Não fazer deploy até o contrato e o formato de autenticação do parceiro serem confirmados.

## Segredos necessários — preencher apenas após onboarding

- URL/API base fornecida pelo parceiro.
- Credencial de sandbox.
- Credencial de produção, separada da sandbox.
- Segredo de assinatura dos webhooks.
- Identificador da conta/label/distribuidor.
- Lista contratual de DSPs, territórios, tipos de conteúdo e limites.
- Documentação dos endpoints, metadados, áudio/capa, validação, takedown e relatórios.

Guardar tudo em Supabase Edge Function Secrets ou mecanismo equivalente de segredos do servidor. Nunca colocar em `VITE_*`, `NEXT_PUBLIC_*`, código React, tabelas públicas ou mensagens de chat.

## Critérios de aceitação antes de ativar produção

- Teste de autorização: artista não consegue aprovar nem enviar a faixa de outro artista.
- Teste de direitos: faixa sem licença verificada não pode ser enviada.
- Teste de repetição: duplo clique/retry não cria dois lançamentos no parceiro.
- Teste de webhook: assinatura inválida e evento repetido são rejeitados.
- Teste parcial: falha numa DSP não marca todas as lojas como falhadas nem como entregues.
- Teste de retirada: takedown e correções ficam auditados.
- Teste de segredo: nenhum token aparece no browser, logs ou respostas.
- Teste de recuperação: timeout não perde o identificador/idempotency key nem duplica o lançamento.

## Dependências comerciais e operacionais

A integração real permanece bloqueada até receber resposta formal do parceiro, confirmar onboarding, contrato, custos, territórios, DSPs habilitadas, documentação API e acesso a sandbox. “Todas as lojas” significa todas as lojas incluídas no contrato e habilitadas para a conta A.S MUSIC ANGOLA — não todas as lojas existentes no mercado.

## Proteção do que já existe

Esta preparação é documental. Não altera a conta do administrador principal, tabelas, políticas RLS, dados de utilizadores, pagamentos ou configurações de produção. A migração e as funções devem ser revistas e testadas em ambiente de desenvolvimento antes de qualquer aplicação em produção.
