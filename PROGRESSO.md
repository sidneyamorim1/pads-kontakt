# Kontakt 12-Pad Sampler — Progresso

Última atualização: 06/10/2026

## Onde estão as coisas

Tudo está nesta pasta (`Kontakt-12-Pads-Projeto`). É só levar ela inteira para o outro computador.

| O quê | Pasta |
|---|---|
| App web (React + Vite) | `app/` |
| Pacote Kontakt avulso (script KSP + 8 samples) | `kontakt-library-package/` |

Os originais continuam em `~/.gemini/antigravity-ide/scratch/kontakt-8pad-sampler/` e `~/Desktop/public/kontakt-library-package/`. A partir de agora, trabalhe nesta cópia.

A pasta `node_modules/` não foi copiada. No outro computador, entre em `app/` e rode `npm install`.

## Como rodar o app web

```bash
npm install
npm run dev      # abre em http://localhost:3000
npm run build    # gera a pasta dist/
```

Precisa do Node (este Mac usa a v24).

## O que foi feito hoje

### 1. App web: grade dos 12 pads (`src/components/PadHardware.tsx`)
- **Problema:** a grade usava `auto-fit minmax(80px, 1fr)`. Numa tela larga ficavam 9 pads numa linha e 3 na outra.
- **Correção:** grade fixa de 4 colunas × 3 linhas (`grid-cols-4`).
- **Tamanho:** a largura máxima do controlador acompanha a altura da janela, para as 3 linhas caberem sem rolar:
  `maxWidth: clamp(20rem, calc((100vh - 360px) * 1.7), 64rem)`. Para deixar maior ou menor, ajuste esse valor.
- **Formato:** os pads passaram de quadrados para 4:3 (`aspect-[4/3]`).
- **Celular:** espaçamentos menores. Somem os textos "Som" e "Clique", o campo de renomear e o nome do arquivo.
- **Resultado:** o TypeScript compila sem erros. **Ainda não foi conferido visualmente.**

### 2. App web: atalhos de teclado (`src/App.tsx`)
- Os pads 9 a 12 não tinham tecla. Agora usam `9 0 - =` ou `Z X C V`.

### 3. Pacote Kontakt avulso (`~/Desktop/public/kontakt-library-package/`)
- `Resources/scripts/Controlador_8_Pads.ksp` foi reescrito:
  - 12 pads em grade 4×3. As posições são calculadas a partir de `$ui_w`, `$ui_h`, `$margin`, `$gap` e `$header`.
  - Notas MIDI de C1 (36) a B1 (47).
  - Clicar no pad agora toca o som (antes não tocava nada).
  - Corrigido o erro de compilação: `make_perf_title` não existe no KSP; foi trocado por `make_perfview`.
- `LEIA_ME_INSTRUCOES.txt` atualizado para 12 pads.
- **Não foi testado no Kontakt.** Cole o script no Script Editor e clique em Apply para confirmar que compila.
- **Pendência:** essa pasta só tem 8 samples. Faltam 4 samples para as notas 44 a 47. A pasta do app web já tem os 12, em `public/kontakt-library-package/Samples/`.

## Atenção: há três versões do script KSP

1. `kontakt-library-package/Resources/scripts/Controlador_8_Pads.ksp`: a versão nova, reescrita hoje.
2. `app/public/kontakt-library-package/Resources/scripts/Controlador_8_Pads.ksp`: versão antiga.
3. `app/src/utils/kspGenerator.ts`: o código que monta o script exibido no modal "KSP" do app. Ele usa posições fixas e ainda tem `make_perf_title`, o mesmo erro corrigido no item 1.

Vale unificar: levar a correção e o layout calculado para o `kspGenerator.ts`.

## Próximo passo: interface sem depender do navegador

Decisão pendente. Opções avaliadas:

- **Electron (recomendado):** empacota o app React como programa de desktop (`.app` / `.exe`) e reaproveita quase todo o código. O Web MIDI e o Web Audio continuam funcionando, porque o Electron traz o próprio Chromium. Desvantagem: o app fica com uns 150 MB.
  - Plano: instalar `electron` e `electron-builder`; criar o arquivo principal com janela de tamanho fixo; liberar a permissão de MIDI automaticamente; criar os comandos `npm run app` e `npm run dist`.
- **Tauri:** o app ficaria com uns 10 MB, mas **não serve**. No Mac ele usa o WebKit (Safari), que não suporta Web MIDI.
- **Plugin VST3/AU com JUCE (C++):** interface nativa dentro da DAW, mas exige reescrever tudo do zero. Para usar dentro de uma DAW, o script KSP do Kontakt já cobre isso.

## Checklist para amanhã
- [ ] Abrir o app e conferir visualmente a grade 4×3 (desktop e celular)
- [ ] Testar o script KSP novo no Kontakt
- [ ] Unificar as três versões do KSP (corrigir o `kspGenerator.ts`)
- [ ] Decidir entre Electron e JUCE e começar o empacotamento

---

## 07/10/2026 — App nativo para macOS (Electron)

Decisão tomada: **Electron**. O app agora roda como programa do Mac, sem VS Code, sem navegador e sem `npm run dev`.

- `app/electron/main.cjs`: abre a janela nativa, libera o MIDI e a área de transferência sem perguntar e coloca o menu padrão do Mac.
- `vite.config.ts`: `base: './'`, para o build abrir direto do disco.
- As fontes agora vêm do pacote `@fontsource` e não do Google Fonts, então o app funciona offline.
- O link do `.zip` no Header virou caminho relativo.
- A grade de pads fica centralizada e o título da janela é "Kontakt 12-Pad Sampler".

Comandos (dentro de `app/`):

```bash
npm run app    # build e abre o app (para testar)
npm run dist   # gera release/mac-arm64/Kontakt 12-Pad Sampler.app e o .dmg
```

Conferido no app empacotado: a janela abre, o MIDI é liberado, o clipboard funciona, o .zip está acessível e as fontes carregam.
O app não tem assinatura da Apple. Se for levado para outro Mac, abra com botão direito > Abrir na primeira vez.

### Versão para o iMac 2019 (Intel)
O iMac 2019 tem processador Intel. Para ele, o build é diferente:

```bash
npm run dist:intel   # gera release/mac/Kontakt 12-Pad Sampler.app e release/Kontakt 12-Pad Sampler-1.0.0.dmg
```

Precisa do macOS 13 (Ventura) ou mais novo. O iMac 2019 aceita até o Sequoia (15).

### Presets, formatos e latência (07/10/2026)
- **Presets:** barra acima dos pads com Salvar, Salvar como… e Excluir. Cada preset guarda o kit, as configurações dos pads e os samples carregados. Os dados ficam em `src/utils/presetStore.ts` (IndexedDB) e a barra em `src/components/PresetBar.tsx`.
- **Sessão automática:** o app reabre exatamente como foi fechado.
- **Formatos:** WAV, AIFF, MP3, FLAC, M4A/AAC e OGG. O Chromium não lê AIFF, então o app tem um leitor próprio em `audioEngine.ts`. Um arquivo inválido mostra um aviso. CAF não é aceito.
- **Latência:** o `AudioContext` usa `latencyHint: 0`. A saída caiu de ~16 ms para ~8 ms, medido neste Mac. O áudio é preparado ao abrir o app, e o sample invertido fica em cache.
- **Bug corrigido:** um sample carregado num pad continuava tocando depois de trocar de kit.
- **Testado:** AIFF → salvar preset → trocar kit → fechar → reabrir → carregar preset. O sample voltou.

### 6 cards "Áudios" à direita (07/10/2026)
- Painel separado, de cor rosa/violeta, com 6 cards (ids 13 a 18). Ao clicar, o áudio toca inteiro, sem corte no release. Clicar de novo reinicia do começo. O card fica aceso enquanto toca.
- Teclas T Y / G H / B N. Notas MIDI de C2 a F2 (48 a 53).
- Aceitam sample (botão "Som" ou arrastar) e entram nos presets. Presets antigos, de 12 pads, ganham os 6 cards padrão ao carregar.
- Os 12 pads continuam como eram. O script KSP continua gerado só com os 12.
- Código: `playFull` em `audioEngine.ts`, `SIDE_PADS` em `soundKits.ts` e o painel em `PadHardware.tsx`.
- **Parar áudios:** cada card tem o botão "■ Parar", que só fica ativo enquanto o áudio toca. No topo do painel há o "Parar todos". O fade de saída é de 40 ms, sem estalo. Testado.
- **Correção:** os cards Áudio 2, 3, 4 e 6 tinham pitch +3/+5/+7/+5, e o áudio carregado tocava acelerado. Agora o pitch é 0 em todos. Sessões e presets antigos são corrigidos ao abrir.

---

## 07/10/2026 — Kontakt removido; o app agora se chama "Sampler Studio"

O app não depende mais do Kontakt. Foram removidos:
- os botões "Baixar Pacote Kontakt", "Gerar Script KSP" e "Guia Kontakt";
- o gerador KSP (`kspGenerator.ts`, `KspModal.tsx`, `TutorialModal.tsx`);
- `app/public/` (o .zip e os samples), `app/scripts/` e a pasta `kontakt-library-package/`.

As seções acima que falam de KSP e Kontakt ficaram só como histórico. Tudo pode ser recuperado no git (commit `4685334`).

- **Nome:** "Sampler Studio" (`productName`). Os instaladores são `Sampler Studio-1.0.0.dmg` (Intel) e `Sampler Studio-1.0.0-arm64.dmg`.
- **Dados:** o app continua usando a pasta `~/Library/Application Support/Kontakt 12-Pad Sampler`, para não perder presets e samples (ver `electron/main.cjs`).
- **Topo:** ganhou margem lateral com `style` inline. O reset `* { padding: 0 }` do `index.css` anula as classes `px/py` do Tailwind em todo o app. Corrigir o reset mudaria o espaçamento de tudo, por isso não foi feito.
