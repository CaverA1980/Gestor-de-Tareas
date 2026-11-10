/* Persistencia en localStorage: sesión actual, historial de sesiones y
   nombres de tareas usados antes (para las sugerencias). */

const Storage = (() => {
  const KEYS = {
    CURRENT: "checklist_current_session",
    HISTORY: "checklist_sessions_history",
    TASK_NAMES: "checklist_task_names",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible: la app sigue funcionando en memoria */
    }
  }

  function getCurrentSession() {
    return read(KEYS.CURRENT, null);
  }

  function saveCurrentSession(session) {
    write(KEYS.CURRENT, session);
  }

  function clearCurrentSession() {
    try {
      localStorage.removeItem(KEYS.CURRENT);
    } catch {
      /* ignorar */
    }
  }

  function getSessionHistory() {
    return read(KEYS.HISTORY, []);
  }

  function archiveSession(session) {
    const history = getSessionHistory();
    history.unshift(session);
    write(KEYS.HISTORY, history.slice(0, 50));
  }

  function getTaskNameSuggestions() {
    return read(KEYS.TASK_NAMES, []);
  }

  function rememberTaskNames(names) {
    const existing = getTaskNameSuggestions();
    const merged = [...names, ...existing].filter(Boolean);
    const seen = new Set();
    const deduped = [];
    for (const name of merged) {
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(name.trim());
    }
    write(KEYS.TASK_NAMES, deduped.slice(0, 100));
  }

  return {
    getCurrentSession,
    saveCurrentSession,
    clearCurrentSession,
    getSessionHistory,
    archiveSession,
    getTaskNameSuggestions,
    rememberTaskNames,
  };
})();
