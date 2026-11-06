# A.S MUSIC Angola

Cria uma aplicação web full-stack chamada A.S MUSIC, um projeto independente angolano em desenvolvimento para descoberta musical, submissão de músicas por artistas e futura distribuição digital. Interface em português (Angola), responsiva e mobile-first. Identidade visual premium: fundo preto/carvão, dourado e prateado, tipografia moderna, detalhes de coroa/ondas sonoras discretos. Slogan exato: “Onde o teu som chega mais longe.” Não inventar nem substituir o logótipo oficial: deixar espaço preparado para o administrador carregar o ficheiro do logótipo oficial depois.

OBJETIVO DO MVP: construir uma plataforma funcional de demonstração, não fingir que já tem catálogo licenciado, integrações de distribuição, pagamentos ou acordos com editoras. Não usar músicas comerciais protegidas. Qualquer faixa demonstrativa deve estar claramente identificada como demonstração e sem ficheiro de áudio real, até serem carregados conteúdos autorizados.

PÁGINAS PÚBLICAS:
- Início com hero A.S MUSIC, slogan, pesquisa, secções “Destaques”, “Lançamentos recentes”, “Artistas em destaque”, “Explorar por género”.
- Explorar música com pesquisa/filtros por artista, título e géneros: Kizomba, Kuduro, Semba, Afro House, Rap, Gospel, Zouk e outros.
- Catálogo, página de artista e página de faixa; player com estados visuais, mas só reproduzir quando existir ficheiro de áudio autorizado carregado.
- Página “Para artistas” explicando registo gratuito planeado, submissão e revisão administrativa.
- Contacto e CTA WhatsApp usando https://wa.me/244952958593 com texto pré-preenchido em português para o artista enviar dados/música.

CONTAS E PERMISSÕES:
- Autenticação segura para ouvintes/artistas e painel admin protegido por autorização real no backend/RLS, nunca apenas esconder botões no frontend.
- Artistas podem criar conta, gerir o seu perfil e consultar apenas as próprias submissões e relatórios.
- Artistas NÃO publicam diretamente. Cada submissão fica pendente e apenas administrador pode aprovar, rejeitar, editar, destacar ou remover.
- Formulário de submissão com título, artista, género, descrição, capa, ficheiro de áudio, créditos, titulares dos direitos, confirmação de que o artista controla/tem autorização dos direitos e consentimento para os usos selecionados. O fluxo deve indicar que o envio não garante publicação.
- Downloads apenas para faixas em que a licença/regra de direitos permita; respeitar direitos e não expor ficheiros privados. Se não houver licença de download, desativar download.
- Admin dashboard: visão geral, gestão de artistas, faixas pendentes/aprovadas, catálogo, destaques, géneros, relatórios, definições e área de direitos/licenças.
- Apenas admin pode alterar percentagens, estados de pagamento e dados financeiros. Não criar pagamento real nesta fase.

MODELO FINANCEIRO INFORMATIVO:
- Configuração inicial proposta: A.S MUSIC recebe 10% do valor que sobra após a comissão efetiva do distribuidor; artista recebe 90% desse valor. Deixar a comissão do distribuidor configurável e não assumir taxa. Mostrar exemplo calculado e rótulo “proposta sujeita a contrato”. Não afirmar que há receitas reais.
- Relatórios financeiros com bruto, comissão do distribuidor, saldo após comissão, 10% A.S MUSIC, 90% artista, pendente/pago, sem simular transações reais. Marcar dados de demonstração.

DIREITOS E DISTRIBUIÇÃO:
- Separar claramente streaming/download na plataforma de distribuição para Spotify/Apple/Deezer/YouTube Music. Mostrar “Acordos e integrações em negociação / por confirmar”; não afirmar que existe parceiro ou licença. Catálogo amplo de música angolana só será integrado mediante autorização/licenciamento escrito dos titulares ou distribuidores.
- Área admin para registar titular, território, modalidades (streaming/download), prazo, evidência/documento de licença e estado de verificação. Bloquear publicação e download quando autorização não estiver confirmada.

QUALIDADE:
- Design refinado e consistente em todas as páginas; navegação clara, acessibilidade, estados vazios, loading e erros; dados de exemplo identificados como demonstração; textos naturais em português de Angola.
- Usar backend/database e autenticação disponíveis na stack Lovable quando possível. Criar esquema seguro e políticas de acesso. Nunca incluir credenciais secretas no código.
- Criar conteúdo de demonstração sem artistas reais ou faixas protegidas.
- No fim, explicar o que ficou implementado e o que ainda exige logótipo, ficheiros, validação de direitos, parceiro de distribuição e configuração legal/financeira.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/178a5592-508f-415c-b360-ee120203ece1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
