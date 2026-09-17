# Painel de Precificação & Tributos — Lanzi / MS Indústria

Este pacote contém o app completo para você hospedar fora do claude.ai, com um banco de
dados em nuvem baseado numa Google Planilha — funciona para qualquer pessoa com o link,
independente de ter conta no Claude.

**Arquivos deste pacote:**
- `index.html` — o app (abra este arquivo, é ele que você hospeda)
- `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — permitem instalar o app como programa de verdade (ícone, janela própria, funciona offline)
- `Code.gs` — o backend que vai para dentro do Google Apps Script
- Este arquivo (`LEIA-ME.md`) — o passo a passo

Tudo funciona **sem nenhum destes arquivos** também — se você não quiser configurar a nuvem
agora, é só abrir o `index.html` direto no navegador e usar normalmente (os dados ficam só
naquele computador).

---

## Parte 1 — Criar o banco de dados na nuvem (Google Planilha + Apps Script)

Gratuito, sem instalar nada, leva uns 5 minutos.

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco.
   Dê um nome a ela, por exemplo "Banco de Dados — Painel Lanzi".
2. No menu, clique em **Extensões → Apps Script**. Vai abrir uma nova aba com um editor de código.
3. Apague todo o conteúdo de exemplo (`function myFunction() {...}`) que já vem escrito.
4. Abra o arquivo `Code.gs` deste pacote, copie **todo** o conteúdo, e cole no editor do Apps Script.
5. Clique no ícone de salvar (💾) ou `Ctrl+S`.
6. Clique no botão azul **Implantar → Nova implantação**.
7. Ao lado de "Tipo", clique no ícone de engrenagem ⚙️ e escolha **App da Web**.
8. Preencha:
   - **Executar como:** Eu (seu e-mail)
   - **Quem tem acesso:** Qualquer pessoa
9. Clique em **Implantar**. O Google vai pedir para autorizar o script — clique em
   **Autorizar acesso**, escolha sua conta, clique em **Avançado** e depois em
   **Acessar [nome do projeto] (não seguro)** — essa mensagem aparece porque é um script seu,
   não publicado na loja do Google; é seguro porque você mesmo escreveu/colou o código.
10. Copie a **URL do app da Web** que aparece (termina em `/exec`). É essa URL que vai no painel.

> ⚠️ Trate essa URL como uma senha: qualquer pessoa que a tiver consegue ler e alterar os
> dados da planilha através dela. Não publique essa URL em lugares abertos — compartilhe só
> com quem deve usar o painel (por exemplo, você e o financeiro).

**Sempre que você editar o `Code.gs` de novo:** repita "Implantar → Gerenciar implantações →
editar (ícone de lápis) → Nova versão → Implantar". A URL continua a mesma.

---

## Parte 2 — Hospedar o app (para funcionar como um site de verdade, instalável)

Qualquer uma das opções abaixo é gratuita. GitHub Pages é a mais simples se vocês já usam GitHub.

### Opção A — GitHub Pages
1. Crie uma conta em [github.com](https://github.com) se ainda não tiver.
2. Crie um repositório novo (pode ser privado).
3. Faça upload de todos os arquivos deste pacote (`index.html`, `manifest.json`,
   `service-worker.js`, os três `.png`) para a raiz do repositório — **exceto** o `Code.gs`
   (esse fica só no Apps Script) e este `LEIA-ME.md` (opcional manter).
4. Vá em **Settings → Pages**, em "Source" escolha a branch principal (`main`) e pasta `/root`.
5. Salve. Em alguns minutos o GitHub te dá um link tipo
   `https://seu-usuario.github.io/nome-do-repositorio/`.

### Opção B — Netlify (arrastar e soltar, ainda mais simples)
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste a pasta com os arquivos deste pacote (menos o `Code.gs`) para a página.
3. Pronto — Netlify já te dá um link público na hora.

---

## Parte 3 — Conectar o app à nuvem

1. Abra o link do app hospedado (Parte 2).
2. Vá na aba **Configurações**, seção "Sincronização em nuvem".
3. Cole a URL do Apps Script (Parte 1) no campo indicado.
4. Digite seu nome no campo "Seu nome" (aparece como autor no Histórico).
5. Clique em **Conectar / atualizar agora**.
6. O indicador no topo deve mudar para "☁️ Sincronizado na nuvem".
7. Envie o mesmo link do app (Parte 2) para o financeiro — ela faz o mesmo passo 3 a 6, uma
   única vez, no navegador dela. A partir daí, tudo que qualquer um dos dois salvar aparece
   para o outro (o app verifica atualizações a cada 20 segundos automaticamente).

---

## Parte 4 — Instalar como app no computador

Com o app já hospedado (Parte 2) e aberto no Chrome ou Edge:
1. Clique nos três pontinhos (⋮) no canto superior direito do navegador.
2. Procure por "Instalar [nome do app]" ou "Mais ferramentas → Criar atalho" (marque "Abrir
   como janela").
3. Um ícone aparece na área de trabalho / menu iniciar. A partir de agora ele abre numa
   janela própria, sem barra de endereço — como um programa instalado — e funciona mesmo
   sem internet para os dados já carregados (graças ao `service-worker.js`).

---

## Perguntas frequentes

**Se eu não configurar a nuvem, o app quebra?**
Não. Sem uma URL preenchida, o app funciona 100% normalmente, só que os dados ficam
salvos apenas no navegador de cada pessoa (não sincronizam entre vocês).

**Posso trocar a planilha por Airtable depois?**
Sim — a estrutura de comunicação é simples (poucas ações: ler/gravar configuração, ler/gravar
GMV, listar/salvar/excluir produtos). Se quiser migrar, me avise e eu adapto o `Code.gs`
equivalente para Airtable.

**É seguro deixar "Quem tem acesso: Qualquer pessoa" no Apps Script?**
Para uma ferramenta interna como essa, sim, desde que a URL não seja divulgada publicamente
(ela funciona como uma senha, como explicado na Parte 1). Se quiser uma camada extra de
proteção, posso adicionar uma senha simples verificada dentro do próprio `Code.gs`.
