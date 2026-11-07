# A.S MUSIC ANGOLA — revisão de prontidão para publicação

Data da revisão: 2026-11-07

## Resultado executivo

**Estado: NÃO PRONTA PARA PUBLICAÇÃO COMERCIAL/PRODUÇÃO.** A aplicação pode continuar a ser preparada e testada em ambiente de desenvolvimento/homologação, mas não se deve anunciar distribuição global, pagamentos por visualizações ou checkout Premium como serviços activos.

## O que foi verificado

- PR #4 foi integrado em `main`: prepara a revisão administrativa e a exportação de manifestos de distribuição. Não envia áudio para DSPs nem confirma entregas.
- PR #5 está aberto em rascunho: painel/ledger de receitas e catálogo de fornecedores publicitários. Build anterior no commit `fcd2b8c` passou; alteração posterior ao workflow ainda carece de execução de CI.
- PR #6 está aberto em rascunho e depende da branch de PR #5: prepara Premium pré-pago, chat e definições de pagamento. Não existe CI executado no head actual.
- O workflow foi alargado para incluir lint, testes Vitest e build em pull requests. É necessário obter uma execução válida e corrigir todos os erros.
- Nenhuma migração destes PRs foi aplicada à base de dados Supabase de produção e nenhuma Edge Function foi publicada.

## Bloqueadores de lançamento

### 1. Pagamentos Premium
- A allowlist de métodos está vazia no frontend e no servidor.
- A conta bancária disponível é pessoal; a aceitação de cobranças comerciais ainda não foi confirmada por escrito pelo banco/provedor.
- AppyPay ainda não forneceu confirmação comercial/contratual, Sandbox aprovado e credenciais de produção.
- O webhook e a criação de cobrança ainda não foram homologados ponta-a-ponta.
- Não activar métodos, não aceitar pagamentos e não anunciar checkout activo antes de aprovação bancária/comercial e testes.

### 2. Publicidade e ganhos por visualizações
- O catálogo de fornecedores contém candidatos para contacto, não contratos, aprovações ou integrações.
- Não há rede publicitária ligada, receitas recebidas nem pagamentos a artistas/distribuidoras por visualizações.
- Só reconhecer receitas após relatórios válidos do fornecedor e liquidação real.
- Definir percentagens, regras antifraude, limiares, calendário, impostos/encargos e termos escritos antes de qualquer promessa de remuneração.

### 3. Distribuição musical
- PR #4 apenas prepara fila de aprovação/exportação de manifesto.
- A distribuição directa exige onboarding do agregador, contrato, DSPs/territórios contratados, documentação técnica, credenciais seguras e Sandbox.
- Exigir verificação de direitos, metadados, assets, idempotência, retries, webhooks autenticados e confirmação real de entrega.
- Não mostrar “distribuída” sem confirmação do parceiro.

### 4. Segurança e base de dados
- Rever todas as migrations em ambiente de teste, comparar com o esquema real e verificar RLS, grants, funções SECURITY DEFINER, triggers e políticas Storage.
- Testar isolamento entre artistas, acesso exclusivo do administrador principal, upload/download privado e tentativas de alteração de pagamentos por clientes.
- Executar Supabase advisors e testes de autorização antes de aplicar qualquer migration.
- Fazer backup e plano de rollback. Nenhuma alteração de produção está autorizada por este documento.

### 5. Qualidade e operação
- Obter CI verde para lint, testes e build nos PRs #5 e #6.
- Executar testes funcionais de registo, login, recuperação de acesso, submissão, revisão administrativa, catálogo, Premium, chat, permissões e fluxos de erro.
- Testar em Android/mobile e desktop, acessibilidade, desempenho, logs, monitorização, backups e recuperação.
- Substituir conteúdo de demonstração apenas por conteúdo com direitos e autorizações documentados.
- Configurar domínio, HTTPS, política de privacidade, termos, direitos de autor, cookies/consentimento quando aplicável, suporte e informação comercial.

## Critérios para autorizar publicação

1. Todas as verificações automáticas (lint, testes e build) passam.
2. Testes integrados e de segurança passam em staging com dados não produtivos.
3. Migrações são revistas, aprovadas, aplicadas em staging e verificadas; produção só após autorização explícita.
4. Fornecedores de pagamentos, publicidade e distribuição têm contratos/aprovações e credenciais válidas, ou as respectivas funções permanecem claramente desactivadas.
5. Direitos/licenças do catálogo e conteúdos estão documentados.
6. O proprietário aprova o diff final, a política comercial, os contratos e a publicação.

## Regra de comunicação

Distinguir sempre: preparado, testado, aprovado por fornecedor, implantado em produção e efectivamente pago/entregue. Nunca apresentar uma etapa como concluída sem evidência verificável.

## Resultado CI observado nesta revisão
- A primeira execução do workflow ampliado falhou no passo de lint com 1.417 ocorrências reportadas, maioritariamente regras de formatação `prettier/prettier`; por consequência, testes e build foram ignorados nessa execução.
- O workflow foi ajustado para separar as regras ESLint de correcção do código da regra de formatação Prettier preexistente. A formatação continua a ser dívida técnica e não é declarada resolvida.
- É necessária uma nova execução completa de lint, testes e build depois desta alteração; até existir resultado verde, a qualidade da release permanece pendente.

## Decisão sobre a regra de formatação
A tentativa de excluir a regra Prettier do lint foi revertida. A verificação de release mantém o lint completo, incluindo formatação; não é aceitável ocultar os erros para produzir um CI aparentemente verde. O relatório de CI registou 1.417 ocorrências, principalmente `prettier/prettier`, e não foi possível aplicar automaticamente uma reformatação persistente a todo o repositório através da integração GitHub disponível nesta sessão. O lint completo deve continuar bloqueante até o código ser formatado e os testes/build passarem.
