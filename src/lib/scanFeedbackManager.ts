/**
 * Scan Feedback Manager - Feedback háptico e sonoro
 * Fornece beeps, vibrações e micro-interações para warehouse
 */

export class ScanFeedbackManager {
  private static audioContext: AudioContext | null = null;

  /**
   * Inicializa o contexto de áudio (chamado na primeira interação)
   */
  private static initAudioContext(): AudioContext {
    if (this.audioContext) return this.audioContext;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      return this.audioContext;
    } catch (e) {
      console.warn('[ScanFeedback] Web Audio API not available');
      return null as any;
    }
  }

  /**
   * Beep de sucesso: tom de 440Hz por 200ms
   * Frequência padrão de "sucesso" em sistemas de scanning
   */
  static beepSuccess(): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // Nota musical "A4"
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Fade in/out para suavidade
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.18);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (e) {
      console.warn('[ScanFeedback] Beep failed:', e);
    }
  }

  /**
   * Beep de erro: tom duplo (300Hz + pausa + 600Hz)
   * Padrão reconhecível de "erro" em scanning
   */
  static beepError(): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const dur = 0.5;  // ← NOVO: Aumentado para 500ms (mais detectável)

      // Primeiro tom: 200Hz (mais grave, melhor em ruído de warehouse)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.value = 200;  // ← NOVO: Mudado de 300Hz para 200Hz
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      gain1.gain.setValueAtTime(0.25, now);  // ← NOVO: Volume maior
      gain1.gain.linearRampToValueAtTime(0, now + dur);
      osc1.start(now);
      osc1.stop(now + dur);

      // Segundo tom: 600Hz (harmônico)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.value = 600;
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0.2, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0, now + dur);
      osc2.start(now + 0.25);
      osc2.stop(now + dur);
    } catch (e) {
      console.warn('[ScanFeedback] Error beep failed:', e);
    }
  }

  /**
   * Beep de aviso: tom contínuo em 800Hz por 300ms
   * Indica conflito ou situação que precisa atenção
   */
  static beepWarning(): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (e) {
      console.warn('[ScanFeedback] Warning beep failed:', e);
    }
  }

  /**
   * Vibração de sucesso: padrão único 50ms
   * Compatível com tablets e smartphones
   */
  static vibrateSuccess(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        console.warn('[ScanFeedback] Vibration not available');
      }
    }
  }

  /**
   * Vibração de erro: padrão duplo (50ms + pausa 50ms + 50ms)
   * Padrão reconhecível como falha
   */
  static vibrateError(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([50, 50, 50]);
      } catch (e) {
        console.warn('[ScanFeedback] Vibration not available');
      }
    }
  }

  /**
   * Vibração de aviso: padrão triplo intenso
   * (100ms + 50ms pausa + 100ms)
   */
  static vibrateWarning(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        console.warn('[ScanFeedback] Vibration not available');
      }
    }
  }

  /**
   * Feedback completo de sucesso: beep + vibração
   */
  static indicateSuccess(): void {
    this.beepSuccess();
    this.vibrateSuccess();
  }

  /**
   * Feedback completo de erro: beep duplo + vibração
   */
  static indicateError(): void {
    this.beepError();
    this.vibrateError();
  }

  /**
   * Feedback completo de aviso: beep contínuo + vibração
   */
  static indicateWarning(): void {
    this.beepWarning();
    this.vibrateWarning();
  }

  /**
   * Testa todos os feedback (útil para debugging)
   */
  static testAll(): void {
    console.log('[ScanFeedback] Testing all feedback patterns...');

    setTimeout(() => {
      console.log('- Testing success beep');
      this.indicateSuccess();
    }, 200);

    setTimeout(() => {
      console.log('- Testing error beep');
      this.indicateError();
    }, 800);

    setTimeout(() => {
      console.log('- Testing warning beep');
      this.indicateWarning();
    }, 1400);
  }
}

/**
 * Hook React para usar ScanFeedbackManager com segurança
 */
export function useScanFeedback() {
  return {
    success: () => ScanFeedbackManager.indicateSuccess(),
    error: () => ScanFeedbackManager.indicateError(),
    warning: () => ScanFeedbackManager.indicateWarning()
  };
}
