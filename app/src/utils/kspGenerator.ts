export interface PadKspConfig {
  id: number;
  name: string;
  midiNote: number;
  volume: number; // 0 to 100
  pitch: number;  // -12 to 12 semitones
  pan: number;    // -100 to 100
}

export function generateKspScript(pads: PadKspConfig[], scriptName: string = "Controlador 12 Pads"): string {
  const padDeclarations = pads.map(p => `  declare ui_button $pad_${p.id}`).join('\n');
  const padTextSet = pads.map(p => `  set_text($pad_${p.id}, "${p.id}. ${p.name.toUpperCase()}")`).join('\n');
  
  const padSizeSet = pads.map((p) => {
    // 3 rows of 4 pads
    const col = (p.id - 1) % 4;
    const row = Math.floor((p.id - 1) / 4);
    const x = 50 + col * 125;
    const y = 60 + row * 85;
    return `  move_control_px($pad_${p.id}, ${x}, ${y})\n  set_control_par($pad_${p.id}, $CONTROL_PAR_WIDTH, 105)\n  set_control_par($pad_${p.id}, $CONTROL_PAR_HEIGHT, 70)`;
  }).join('\n');

  const midiNoteMap = pads.map(p => `  $midi_note_${p.id} := ${p.midiNote}`).join('\n');

  const noteTriggers = pads.map(p => `
    if ($EVENT_NOTE = $midi_note_${p.id})
      $pad_${p.id} := 1
      $last_event_id := play_note($EVENT_NOTE, $EVENT_VELOCITY, 0, -1)
      change_vol($last_event_id, (${p.volume} - 100) * 100, 0)
      change_tune($last_event_id, ${p.pitch} * 100000, 0)
      change_pan($last_event_id, ${p.pan} * 10, 0)
    end if`).join('\n');

  const releaseTriggers = pads.map(p => `
    if ($EVENT_NOTE = $midi_note_${p.id})
      $pad_${p.id} := 0
    end if`).join('\n');

  const uiControlCallbacks = pads.map(p => `
on ui_control ($pad_${p.id})
  if ($pad_${p.id} = 1)
    play_note($midi_note_${p.id}, 127, 0, -1)
  end if
end on`).join('\n');

  return `{ ============================================================ }
{ SCRIPT DE INTERFACE PARA KONTAKT - CONTROLADOR DE 12 PADS   }
{ Gerado automaticamente por Sampler Studio                   }
{ Nome do Instrumento: ${scriptName}                          }
{ ============================================================ }

on init
  make_perf_title("${scriptName}")
  set_ui_height_px(350)
  set_script_title("Controlador 12 Pads")
  
  declare $last_event_id
  
${midiNoteMap}
${padDeclarations}
${padTextSet}
${padSizeSet}

  message("Script do Controlador de 12 Pads carregado com sucesso!")
end on

on note
  ignore_event($EVENT_ID)
${noteTriggers}
end on

on release
${releaseTriggers}
end on

${uiControlCallbacks}
`;
}
