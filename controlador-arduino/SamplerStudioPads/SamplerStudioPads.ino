// Sampler Studio Pads — controlador MIDI USB com 21 botões arcade para o Raspberry Pi Pico.
//
// O Mac reconhece a placa como "Sampler Studio Pads" (MIDI USB, sem driver).
// Cada botão manda uma nota MIDI que dispara o pad correspondente no Sampler Studio:
//   Pads 1 a 12   -> notas 36 a 47 (C1 a B1)
//   Áudio 1 a 9   -> notas 48 a 56 (C2 a G#2)
//
// Ligação: um terminal de cada botão no pino GPIO da tabela, o outro no GND.
// Não precisa de resistor (usa o pull-up interno da Pico).
//
// IDE do Arduino: placa "Raspberry Pi Pico" (core Earle Philhower) com
// Ferramentas > USB Stack > "Adafruit TinyUSB". Bibliotecas: "Adafruit TinyUSB Library" e "MIDI Library".

#include <Adafruit_TinyUSB.h>
#include <MIDI.h>

Adafruit_USBD_MIDI usbMidi;
MIDI_CREATE_INSTANCE(Adafruit_USBD_MIDI, usbMidi, MIDI);

const uint8_t MIDI_CHANNEL = 1;
const uint8_t VELOCITY = 127;      // botão arcade não tem sensibilidade: sempre força máxima
const uint32_t DEBOUNCE_MS = 8;    // ignora o "repique" do microswitch depois de cada mudança

struct Button {
  uint8_t pin;
  uint8_t note;
};

// Mesma ordem da tela do Sampler Studio
const Button BUTTONS[] = {
  // 12 pads (grade 4 x 3)
  { 0, 36 }, { 1, 37 }, { 2, 38 }, { 3, 39 },    // Pad 1  a 4
  { 4, 40 }, { 5, 41 }, { 6, 42 }, { 7, 43 },    // Pad 5  a 8
  { 8, 44 }, { 9, 45 }, { 10, 46 }, { 11, 47 },  // Pad 9  a 12
  // 9 cards de áudio (grade 3 x 3, na mesma posição da tela)
  { 12, 48 }, { 13, 49 }, { 14, 54 },            // Áudio 1, Áudio 2, Áudio 7
  { 15, 50 }, { 16, 51 }, { 17, 55 },            // Áudio 3, Áudio 4, Áudio 8
  { 18, 52 }, { 19, 53 }, { 20, 56 },            // Áudio 5, Áudio 6, Áudio 9
};
const uint8_t NUM_BUTTONS = sizeof(BUTTONS) / sizeof(BUTTONS[0]);

bool pressed[NUM_BUTTONS];
uint32_t lastChange[NUM_BUTTONS];
uint32_t ledOffAt = 0;

void setup() {
  // Nome que aparece no Mac e no Sampler Studio ("MIDI: Sampler Studio Pads")
  TinyUSBDevice.setManufacturerDescriptor("Sampler Studio");
  TinyUSBDevice.setProductDescriptor("Sampler Studio Pads");
  usbMidi.setStringDescriptor("Sampler Studio Pads");

  if (!TinyUSBDevice.isInitialized()) {
    TinyUSBDevice.begin(0);
  }
  MIDI.begin(MIDI_CHANNEL_OMNI);
  MIDI.turnThruOff();

  // Reconecta o USB para o Mac ler o nome novo
  if (TinyUSBDevice.mounted()) {
    TinyUSBDevice.detach();
    delay(10);
    TinyUSBDevice.attach();
  }

  for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
    pinMode(BUTTONS[i].pin, INPUT_PULLUP);
    pressed[i] = false;
    lastChange[i] = 0;
  }
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
#ifdef TINYUSB_NEED_POLLING_TASK
  TinyUSBDevice.task();
#endif

  const uint32_t now = millis();

  for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
    // Pull-up: solto = HIGH, apertado = LOW (botão liga o pino ao GND)
    const bool isDown = digitalRead(BUTTONS[i].pin) == LOW;
    if (isDown == pressed[i] || now - lastChange[i] < DEBOUNCE_MS) continue;

    // Manda a nota já na primeira mudança (sem esperar o debounce), para não atrasar o som
    pressed[i] = isDown;
    lastChange[i] = now;
    if (isDown) {
      MIDI.sendNoteOn(BUTTONS[i].note, VELOCITY, MIDI_CHANNEL);
      digitalWrite(LED_BUILTIN, HIGH);
      ledOffAt = now + 60;
    } else {
      MIDI.sendNoteOff(BUTTONS[i].note, 0, MIDI_CHANNEL);
    }
  }

  // LED da placa pisca a cada toque (ajuda a testar a ligação)
  if (ledOffAt && now >= ledOffAt) {
    digitalWrite(LED_BUILTIN, LOW);
    ledOffAt = 0;
  }

  // Descarta mensagens que cheguem do computador
  MIDI.read();
}
