# Controlador de pads para o Sampler Studio

O controlador tem 21 botões arcade ligados a um Raspberry Pi Pico. O Mac reconhece a placa como um teclado MIDI USB chamado **"Sampler Studio Pads"**. Ela não precisa de driver.

Cada botão dispara o pad que está na mesma posição da tela do Sampler Studio.

```
        12 PADS                       ÁUDIOS
┌────┬────┬────┬────┐          ┌────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │          │ Á1 │ Á2 │ Á7 │
├────┼────┼────┼────┤          ├────┼────┼────┤
│ 5  │ 6  │ 7  │ 8  │          │ Á3 │ Á4 │ Á8 │
├────┼────┼────┼────┤          ├────┼────┼────┤
│ 9  │ 10 │ 11 │ 12 │          │ Á5 │ Á6 │ Á9 │
└────┴────┴────┴────┘          └────┴────┴────┘
```

## Lista de compras

| Qtde | Item | Observação |
|---|---|---|
| 1 | **Raspberry Pi Pico** (RP2040), de preferência a "Pico H" | A "H" já vem com os pinos soldados. **Não** compre a Pico 2 nem placas "RP2040-Zero" (poucos pinos). |
| 21 | **Botões arcade 30 mm** com microswitch | Ex.: 12 de uma cor para os pads e 9 de outra (rosa ou roxo) para os áudios, como na tela. |
| 1 | Cabo **micro-USB de dados** | Cabos "só de carga" não funcionam. |
| ~10 m | Fio flexível fino (22 a 26 AWG) | Um fio por botão, mais o fio do GND. |
| 42 | Terminais fêmea "faston" 4,8 mm, ou solda | Dois por botão. |
| 1 | Caixa (MDF, madeira ou acrílico) | Furos de 28 a 30 mm, conforme o botão. Deixe uns 40 mm entre os centros dos furos. |

## Ligação

Cada botão tem dois terminais usados: **COM** e **NO**. O terceiro (NC) fica sem ligação.

- **NO** → no pino da Pico indicado na tabela abaixo.
- **COM** → no **GND**. Pode ligar todos os COM num mesmo fio, em sequência de botão em botão, e levar esse fio a qualquer pino GND da Pico.

Não precisa de resistor.

> Atenção: o número do **GP** (nome do pino) é diferente da **posição física** na placa. A tabela mostra os dois.

| Botão | Pino da Pico | Posição física | Nota MIDI |
|---|---|---|---|
| Pad 1 | GP0 | 1 | 36 |
| Pad 2 | GP1 | 2 | 37 |
| Pad 3 | GP2 | 4 | 38 |
| Pad 4 | GP3 | 5 | 39 |
| Pad 5 | GP4 | 6 | 40 |
| Pad 6 | GP5 | 7 | 41 |
| Pad 7 | GP6 | 9 | 42 |
| Pad 8 | GP7 | 10 | 43 |
| Pad 9 | GP8 | 11 | 44 |
| Pad 10 | GP9 | 12 | 45 |
| Pad 11 | GP10 | 14 | 46 |
| Pad 12 | GP11 | 15 | 47 |
| Áudio 1 | GP12 | 16 | 48 |
| Áudio 2 | GP13 | 17 | 49 |
| Áudio 7 | GP14 | 19 | 54 |
| Áudio 3 | GP15 | 20 | 50 |
| Áudio 4 | GP16 | 21 | 51 |
| Áudio 8 | GP17 | 22 | 55 |
| Áudio 5 | GP18 | 24 | 52 |
| Áudio 6 | GP19 | 25 | 53 |
| Áudio 9 | GP20 | 26 | 56 |
| **GND (COM de todos)** | GND | 3, 8, 13, 18, 23 ou 28 | — |

A posição física conta assim: com o USB virado para cima, o pino 1 é o do canto superior esquerdo. Os pinos 1 a 20 descem pelo lado esquerdo, e os pinos 21 a 40 sobem pelo lado direito.

Os pinos GP21, GP22, GP26, GP27 e GP28 ficam livres para extras, como um botão "parar áudios" ou potenciômetros de volume.

## Gravar a placa (jeito fácil, sem a IDE do Arduino)

1. Segure o botão **BOOTSEL** da Pico e, sem soltar, ligue o cabo USB no Mac.
2. Aparece um disco chamado **RPI-RP2** no Finder. Pode soltar o botão.
3. Arraste o arquivo **`SamplerStudioPads.uf2`** (desta pasta) para dentro do RPI-RP2.
4. O disco some sozinho: a placa reiniciou já como controlador MIDI.

Só é preciso gravar uma vez. Depois disso, basta ligar o cabo.

## Testar

1. Abra o Sampler Studio e ligue a Pico no USB.
2. No topo do app deve aparecer **"MIDI: Sampler Studio Pads"**. Se aparecer "Clique para Conectar MIDI", clique nele.
3. Aperte os botões. O LED da Pico pisca a cada toque, e o pad correspondente dispara na tela.

Dá para testar antes de montar a caixa: encoste um fio do GND no pino de cada botão. É como apertar o botão.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| O disco RPI-RP2 não aparece | Cabo só de carga, ou o BOOTSEL não estava apertado ao ligar o cabo |
| O app não mostra "Sampler Studio Pads" | Clique em "Clique para Conectar MIDI". Se não resolver, troque o cabo ou a porta USB |
| O LED não pisca ao apertar | Botão sem ligação ao GND, ou fio no pino errado (confira a tabela) |
| O LED pisca, mas dispara o pad errado | Fio trocado entre dois botões |
| Um pad dispara sozinho | Fio do pino encostando no GND, ou microswitch com defeito |

## Alterar o código (opcional)

O código-fonte está em `SamplerStudioPads/SamplerStudioPads.ino`. Para gravar a partir da IDE do Arduino:

1. Em **Arduino IDE → Settings → Additional boards manager URLs**, adicione:
   `https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json`
2. Em **Boards Manager**, instale **"Raspberry Pi Pico/RP2040"** (Earle F. Philhower). A versão 5.7.0 foi testada. Em outubro de 2026, a 6.x falhava no download.
3. Em **Library Manager**, instale **"Adafruit TinyUSB Library"** e **"MIDI Library"** (Francois Best).
4. Em **Tools**, selecione a placa **"Raspberry Pi Pico"** e em **USB Stack** escolha **"Adafruit TinyUSB"**.
5. Clique em **Upload**. Na primeira vez, ligue a placa segurando o BOOTSEL.
