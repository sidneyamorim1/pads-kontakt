# Kontakt 12-Pad Sampler

App de desktop para macOS: 12 pads e 6 cards de áudio, com MIDI, presets e gerador de script KSP para o Kontakt.
Feito em React + Vite e empacotado com Electron.

## Rodar e gerar o app

Precisa do Node 20 ou mais novo.

```bash
cd app
npm install
npm run app          # abre o app para testar
npm run dist         # gera o .app e o .dmg para Mac com chip Apple (M1/M2/M3)
npm run dist:intel   # gera o .app e o .dmg para Mac Intel (ex.: iMac 2019)
```

Os instaladores ficam em `app/release/`.

## Pastas

| Pasta | Conteúdo |
|---|---|
| `app/src` | Interface React e motor de áudio |
| `app/electron` | Processo principal do Electron (janela nativa e permissões de MIDI) |
| `app/public` | Pacote da biblioteca Kontakt baixado pelo app |
| `kontakt-library-package` | Script KSP e samples para montar o instrumento no Kontakt |

O histórico e as pendências estão em `PROGRESSO.md`.
