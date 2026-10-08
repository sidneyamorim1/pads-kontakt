# Sampler Studio

App de desktop para macOS e Windows com 12 pads, 9 cards de áudio que tocam até o fim, MIDI e presets.
Feito em React + Vite e empacotado com Electron.

## Rodar e gerar o app

Precisa do Node 20 ou mais novo.

```bash
cd app
npm install
npm run app          # abre o app para testar
npm run dist         # gera o .app e o .dmg para Mac com chip Apple (M1/M2/M3)
npm run dist:intel   # gera o .app e o .dmg para Mac Intel (ex.: iMac 2019)
npm run dist:win     # gera o instalador e a versão portátil para Windows (64 bits)
```

Os instaladores ficam em `app/release/`.

## Pastas

| Pasta | Conteúdo |
|---|---|
| `app/src` | Interface React, motor de áudio e presets |
| `app/electron` | Processo principal do Electron (janela nativa e permissões de MIDI) |
| `controlador-arduino` | Controlador físico de 21 botões (Raspberry Pi Pico): código, arquivo pronto para gravar e guia de montagem |

O histórico e as pendências estão em `PROGRESSO.md`.
