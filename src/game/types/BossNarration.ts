export interface BossNarrationConfig {
  introText?: string;
  typewriterEnabled?: boolean;
}

export interface BossNarrationBlockPlayback {
  blockId: 'intro' | 'question' | 'options';
  text: string;
}

// Extensao futura:
// Um adaptador de audio pode tocar a fala do boss e resolver quando o audio terminar,
// permitindo sincronizar o typewriter com dublagem real sem mudar a API do sistema.
export interface BossNarrationAudioAdapter {
  playBlock?(block: BossNarrationBlockPlayback): Promise<void>;
}
