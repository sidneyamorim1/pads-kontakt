# Kontakt 12-Pad Sampler — Progresso

Última atualização: 08/10/2026

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
- **Frases removidas:** "Clique nos pads para disparar…" (rodapé dos 12 pads) e "Toca até o fim · clicar de novo reinicia" (painel Áudios).
- **9 cards de áudio** em 3×3 (ids 13 a 21). Os novos Áudio 7, 8 e 9 ficam na 3ª coluna, com as teclas U / J / M e as notas MIDI 54 a 56. A ordem na tela está em `SIDE_LAYOUT` (`PadHardware.tsx`). Os pads continuam com 158×118 px. Para isso, o conjunto ficou mais largo (`CONTROLLER_MAX_WIDTH`) e a janela abre com 1400 px.
- **Tela cheia:** os pads e os cards não têm mais tamanho fixo. Eles esticam e ocupam a janela inteira abaixo do topo, deixando 16 px nas bordas. O `aspect-[4/3]` deu lugar a `flex-1` com `grid-rows-3`, e o `CONTROLLER_MAX_WIDTH` saiu. Medidas do pad: 182×163 px na janela padrão, 111×91 px na mínima e 256×237 px em 1920×1050, sempre sem rolagem. Em janelas estreitas, os botões dos cards de áudio mostram só o ícone.

## 07/10/2026 — Saída de áudio e volumes
- **Botão de saída no topo** (ícone de caixa de som, com o nome do dispositivo). Abre o painel "Saída de áudio":
  - **Placa / dispositivo:** lista as saídas do Mac (placa de som, mesa USB, fones…) e usa `AudioContext.setSinkId`.
  - **12 Pads** e **Áudios:** cada grupo tem o seu **canal** e o seu **volume**. Canal pode ser par estéreo (1-2, 3-4…) ou canal mono (1, 2, 3…). As opções seguem o número de canais do dispositivo.
- **Volume geral:** slider no topo.
- A configuração fica salva no computador (`localStorage`, `useAudioOutput.ts`). Se a placa salva não estiver conectada, o app toca no padrão do sistema, avisa no painel e volta para a placa quando ela for reconectada.
- Motor (`audioEngine.ts`): cada grupo passa por volume do grupo → canais escolhidos → volume geral → dispositivo. Cada grupo tem o seu reverb. O analyser, que não era usado, saiu.
- Electron: a verificação de permissão `media` e `speaker-selection` foi liberada para mostrar o nome das placas. O microfone continua bloqueado.
- **Testado:** canais 1-2, só 1, só 2, volume por grupo, volume geral, troca de dispositivo e configuração salva entre aberturas. **Não testado:** placa com mais de 2 canais (nenhuma conectada neste Mac). O código usa `destination.maxChannelCount`.

## 07/10/2026 — Controlador físico (Raspberry Pi Pico + 21 botões arcade)
- Pasta `controlador-arduino/`: firmware (`SamplerStudioPads/SamplerStudioPads.ino`), arquivo pronto para gravar (`SamplerStudioPads.uf2`) e guia (`README.md`) com lista de compras, ligação pino a pino, gravação e testes.
- A placa vira um MIDI USB, "Sampler Studio Pads", que manda as notas 36 a 47 (pads) e 48 a 56 (áudios). **O app não precisou de mudança.**
- Os botões ficam na mesma posição da tela: Áudio 7, 8 e 9 na 3ª coluna (GP14, GP17 e GP20).
- O código compila sem erros com o core rp2040 5.7.0, a Adafruit TinyUSB 3.7.7 e a MIDI Library 5.0.2. **Ainda não foi testado numa placa de verdade.**
- Próximas ideias: botão "parar áudios", potenciômetros de volume (GP26 a GP28 são analógicos) e LEDs nos cards. Essas exigem mudanças no app.

### Próximo passo (pendente): LEDs no controlador
Discutido em 07/10/2026. **Por enquanto o controlador fica sem LEDs e sem integração com o app.**
- Opção recomendada: botões arcade translúcidos de 30 mm, com um LED RGB WS2812 dentro de cada um. Os 21 LEDs ficam em cadeia, ligados num pino só (ex.: GP22) e alimentados pelo VBUS de 5 V, com o brilho limitado no código por causa da corrente do USB. Cada botão acende na cor do pad da tela.
- Comportamento sugerido: o app manda MIDI de volta para a placa ("Sampler Studio Pads"). Os pads piscam a cada disparo, e os cards de áudio ficam acesos enquanto tocam. Para isso, o app precisa enviar MIDI out.
- Alternativa: botões com LED embutido de **5 V** (não 12 V). Exigem 21 fios extras e 3 chips 74HCT595 ou drivers.

---

## 08/10/2026 — Versão Windows, exportar/importar, MIDI Learn e ajustes dos cards

### Versão Windows
- `npm run dist:win` gera `release/Sampler Studio Setup 1.0.0.exe` (instalador) e `release/Sampler Studio 1.0.0 Portatil.exe` (abre sem instalar). Windows 10/11, 64 bits.
- No Windows o primeiro menu é "Arquivo" (no Mac continua o menu do app), em `electron/main.cjs`.
- Sem assinatura: o SmartScreen avisa na primeira vez (Mais informações > Executar assim mesmo). **Ainda não testado num PC com Windows.**
- O `.dmg` Intel foi instalado e testado neste Mac (macOS 13.7): funcionou.

### Exportar / importar presets (arquivo `.sampler`)
- Botões **Exportar** e **Importar** na barra de presets.
- Exportar salva o que está na tela (pads, cards e os áudios carregados) num arquivo `.sampler`, com o nome do preset aberto. Serve para levar kits entre Mac e Windows e como backup.
- Importar aceita um ou vários arquivos. Cada preset é adicionado à lista (nome repetido vira "Nome (2)") e o primeiro é aberto.
- Formato em `src/utils/presetFile.ts`: "SMPLSTD1" + cabeçalho JSON + áudios originais. O cabeçalho aceita vários presets, para um futuro "exportar todos".
- **Testado:** exportar e importar num perfil vazio (como outro computador). O preset e o áudio voltaram. Arquivos inválidos ou cortados são recusados com aviso.
- Exportação conferida também pelo usuário (08/10/2026).

### MIDI Learn
- Botão **MIDI Learn** no topo. Clique num pad ou card e aperte o botão do controlador. O próximo pad é escolhido sozinho (12 pads e depois os cards, na ordem da tela). Esc ou "Concluir" sai.
- Se o botão já era de outro pad, os dois trocam. "Restaurar padrão" volta às notas 36 a 56.
- Aceita nota e CC. O mapeamento fica salvo **no computador** (`localStorage`, `src/utils/midiMap.ts`), não no preset, porque o controlador é o mesmo para todos os presets.
- O leitor MIDI agora é registrado uma vez só. Antes, ele era refeito a cada mudança nos pads.
- O `MidiWizardModal.tsx` (assistente antigo de 8 pads, que não era usado) foi removido.
- **Testado pelo usuário com controlador de verdade (08/10/2026): funcionou.**

### Ajustes dos cards de áudio
- Cada card tem um botão de ajustes (ícone de controles) com:
  - **Repetir (loop)**;
  - **Fade in** e **fade out** de 0 a 10 s. O fade out acontece ao parar e no fim do áudio. As curvas são lineares;
  - **Um por vez**: ao tocar, para os outros cards que também têm esta opção. Um fundo em loop sem a opção continua tocando;
  - **Tocar de novo enquanto toca**: reinicia (padrão) ou para. "Para" deixa ligar e desligar um loop pelo controlador físico.
- O rodapé do card mostra os ajustes ligados (ex.: "Loop · 1 por vez").
- Os ajustes entram na sessão e nos presets. Código: `playFull`/`stopFull` em `audioEngine.ts` e `CardSettingsPanel.tsx`.
- **Testado** no motor de áudio do app: loop, fim natural, reiniciar, parar, um por vez, fade in e fade out.

### Modo edição e remover áudio
- Botão **Editar** no topo. Fora dele os cards ficam limpos para tocar ao vivo: só o pad e, nos cards de áudio, o "Parar".
- No modo edição aparecem: **Som** (carregar), **✕** (remover áudio, só quando há um carregado), **ajustes** (cards de áudio) e o campo de renomear. Arrastar arquivos para os pads também só funciona no modo edição.
- Remover pede confirmação e o pad volta ao som interno. O arquivo sai do armazenamento quando nenhum preset usa mais (limpeza ao excluir presets).
- O app sempre abre fora do modo edição.
- O nome do controlador MIDI no topo é cortado em nomes longos (o nome inteiro aparece ao passar o mouse), para o topo caber numa linha.
- **Testado:** botões escondidos e visíveis nos dois modos, remover num pad e num card.

### Pasta de cópia dos presets (só no app instalado)
- Botão **Pasta de cópia…** na barra de presets. Escolhida a pasta (Dropbox, iCloud, pendrive…), cada **Salvar** também grava `<nome do preset>.sampler` nela, substituindo a cópia anterior do mesmo preset. O botão vira "Cópia: <pasta>" e o ✕ desliga a cópia.
- O salvamento automático da sessão não gera cópia, só o Salvar.
- Se a pasta não estiver disponível (ex.: pendrive removido), o preset é salvo no app normalmente e aparece um aviso.
- Electron: `electron/preload.cjs` (ponte) e `electron/backup.cjs`. A pasta fica guardada em `backup-folder.json`, na pasta de dados do app. A página só consegue gravar arquivos `.sampler` dentro dessa pasta.
- No navegador (`npm run dev`) o botão não aparece.
- **Testado** no Electron com a ponte real: a cópia é gravada e o aviso aparece quando a pasta não existe. A janela de escolher pasta (do sistema) não foi testada automaticamente.

### "Salvar como…" com a janela do sistema (app instalado e Chrome)
- **Salvar como…** (e **Salvar** sem preset aberto) abre a janela de salvar do Mac/Windows. Você escolhe a pasta e o nome. O app grava o `.sampler` ali e cria o preset com o nome do arquivo.
- O preset fica **ligado ao arquivo** (`filePath` no preset): cada **Salvar** depois atualiza o mesmo arquivo. Passar o mouse no Salvar mostra o caminho.
- A janela abre na última pasta usada (ou na pasta de cópia, ou em Documentos). Se já existir no app um preset com o mesmo nome, pergunta antes de substituir.
- Segurança: o processo principal só grava nos arquivos escolhidos na janela (lista em `saved-files.json`, na pasta de dados).
- **No Chrome/Edge (localhost)** também abre a janela do sistema, pela File System Access API (`src/utils/fileSave.ts`). O preset guarda o "handle" do arquivo. Depois de reabrir o navegador, o primeiro Salvar pede permissão para gravar no arquivo. Em navegadores sem essa API (Safari, Firefox) continua o campo de digitar o nome. **Testado pelo usuário no Chrome: funcionou.**
- Corrigido: o "Salvar como…" acumulava "(cópia) (cópia) (cópia)" no nome. Agora a janela sugere o nome do preset aberto, e o campo de digitar põe no máximo um "(cópia)".
- **Testado** no Electron, com a janela simulada: o arquivo é criado, o Salvar seguinte atualiza o arquivo e a gravação fora do permitido é recusada.

### Uma cópia do app por vez
- `electron/main.cjs` usa `requestSingleInstanceLock`. Abrir o app de novo só traz a janela aberta para a frente. Motivo: o app instalado e o `npm run app` usam a mesma pasta de dados, e duas cópias abertas ao mesmo tempo podem estragar os presets. **Testado.**
- Atenção: o Sampler Studio instalado hoje ainda é da versão antiga, sem essa trava. Feche-o antes de rodar `npm run app`.

### Ícone do app
- Ícone próprio: o disco preto sobre laranja, igual ao logo do topo do app (escolhido entre duas propostas).
- Fonte em `app/build/icon.svg`. O `app/build/icon.png` (1024 px) é usado pelo electron-builder, que gera o `.icns` do Mac e o `.ico` do Windows.
- O mesmo desenho virou o ícone da aba do navegador (`app/public/favicon.svg`).
- Para mudar o ícone: edite o `icon.svg`, exporte de novo o `icon.png` em 1024×1024 e gere os instaladores.
- Correção (08/10/2026): o app instalado antes do ícone era o build das 14:46. Foi substituído pelo build com ícone, e o cache de ícones do Mac foi atualizado.
- Nota para quem desenvolve pelo VS Code: o terminal do VS Code define `ELECTRON_RUN_AS_NODE=1`, e qualquer app Electron aberto por ele (inclusive com `open -a`) roda como Node puro e fecha na hora. Use `env -u ELECTRON_RUN_AS_NODE` antes do comando. Pelo Dock ou Finder isso não acontece.

### Pastas `instaladores` e `samples`
- `instaladores/mac` e `instaladores/windows`, na raiz do projeto. `npm run instaladores` (dentro de `app/`) gera Mac Intel + Windows e copia para lá (`app/scripts/copiar-instaladores.cjs`). A pasta fica fora do git: os arquivos passam do limite de 100 MB do GitHub.
- `samples/mp3` e `samples/wav`: lugar para guardar os áudios dos pads. O git guarda só as pastas (`.gitkeep`), não os áudios.

### MIDI: tentativa de "só pads mapeados respondem" (desfeita)
- Testado pelo usuário em 08/10/2026: não funcionou como esperado e foi desfeito. O MIDI voltou ao comportamento anterior: pad sem mapeamento usa a nota padrão (36 a 56).

### Aviso de som bloqueado no navegador
- No Chrome, o som fica bloqueado até o primeiro clique ou tecla na página. Nota MIDI não conta, então o controlador não toca logo depois de abrir ou recarregar a página. Era isso que fazia o MIDI "só funcionar depois de clicar no preset".
- Agora aparece uma faixa laranja "Som bloqueado pelo navegador…" enquanto o som estiver bloqueado, e qualquer clique ou tecla libera o som (`isSuspended`/`resume` em `audioEngine.ts`).
- No app instalado isso não acontece (`autoplay-policy` em `main.cjs`), e a faixa não aparece. O usuário vai usar só o app.

### Nome do som no card
- Ao carregar um áudio, o pad ou card passa a ter o nome do arquivo, sem a extensão (ex.: "Hino de Abertura.mp3" → "Hino de Abertura"). Dá para renomear depois no modo Editar.
- O nome do arquivo em letra pequena só aparece se o pad foi renomeado para outra coisa (para não repetir).
- Nomes longos ocupam até duas linhas. O nome completo aparece ao passar o mouse.
- Áudios carregados antes desta mudança continuam com o nome antigo. Para atualizar, carregue o áudio de novo ou renomeie no modo Editar.
- **Testado** com um nome curto e com um longo.

### Áudio carregado num pad toca inteiro
- Antes, nos 12 pads, o "release" do pad cortava também o áudio carregado (ex.: PAD 1 = 0,4 s). O "Aplausos.wav" do usuário começa baixo e só cresce depois de 0,4 s, então não se ouvia nada.
- Agora um áudio carregado num pad toca até o fim. O release só vale para os sons internos (sintetizados). Tocar de novo sobrepõe, como num pad de bateria. Para sons longos que precisam de Parar, loop ou fade, o lugar certo continua sendo os cards de Áudios.
- **Testado** com o `Aplausos.wav` no PAD 1: o som continua audível em 1 s e em 5 s.
- **Parar nos pads:** pads com áudio carregado ganharam o botão **■ Parar** (ativo só enquanto toca) e acendem enquanto tocam. O painel dos 12 pads ganhou **Parar todos**, que para só os pads. Ao chegar ao fim, o áudio para sozinho. Trocar de kit ou de preset para tudo. Pads com som interno não têm Parar, porque são sons curtos.
- **Testado:** Parar, Parar todos com o pad tocado 2 vezes por cima, e fim natural do áudio.
- **Clicar de novo para:** em pads com áudio carregado, o primeiro toque toca e o segundo para (mouse, teclado e MIDI). Nos cards de Áudios o padrão também passou a ser "para". A opção "Tocar de novo enquanto toca → Reinicia" continua nos ajustes do card, e o rodapé mostra "Reinicia" quando ela está ligada. Cards salvos antes com "Reinicia" escolhido de propósito continuam assim. **Testado.**
- **Ajustes também nos pads:** pads com áudio carregado ganharam o mesmo botão de ajustes dos cards (modo Editar): loop, fade in e fade out, um por vez e tocar de novo (para/reinicia). Por dentro, o pad com áudio usa o mesmo caminho dos cards (`playFull`). O "um por vez" vale dentro de cada grupo: um pad só para pads, e um card só para cards. O rodapé do pad mostra os ajustes ligados. Pads com som interno não têm ajustes. **Testado** no motor e na tela.
