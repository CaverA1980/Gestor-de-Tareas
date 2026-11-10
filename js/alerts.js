/* Monitoreo del plazo de la tarea activa: cuando se acerca o se vence sin
   que el Usuario haya confirmado el cumplimiento, emite sonido y vibración
   en el mismo dispositivo donde está abierta la sesión. */

const AlertManager = (() => {
  const CHECK_INTERVAL_MS = 15 * 1000;
  const WARNING_WINDOW_MS = 5 * 60 * 1000;
  const REPEAT_ALERT_MS = 60 * 1000;

  let audioCtx = null;
  let intervalId = null;
  let lastAlertAt = 0;

  function unlockAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioCtx = null;
    }
  }

  function playSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  }

  function vibrate() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function start(getActiveTask, onAlert) {
    stop();
    intervalId = setInterval(() => {
      const task = getActiveTask();
      if (!task || task.completedAt) return;

      const remaining = new Date(task.deadline).getTime() - Date.now();
      const isNearOrOverdue = remaining <= WARNING_WINDOW_MS;
      if (!isNearOrOverdue) return;

      const now = Date.now();
      if (now - lastAlertAt < REPEAT_ALERT_MS) return;
      lastAlertAt = now;

      playSound();
      vibrate();
      onAlert(task, remaining);
    }, CHECK_INTERVAL_MS);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    lastAlertAt = 0;
  }

  return { unlockAudio, start, stop };
})();
