/* Controlador principal: conecta el formulario de creación, la ejecución
   secuencial de la lista y la vista de reporte final. */

(() => {
  const viewSetup = document.getElementById("view-setup");
  const viewExecution = document.getElementById("view-execution");
  const viewReport = document.getElementById("view-report");

  const formSetup = document.getElementById("form-setup");
  const listNameInput = document.getElementById("list-name");
  const taskCountInput = document.getElementById("task-count");
  const btnGenerateRows = document.getElementById("btn-generate-rows");
  const rowsContainer = document.getElementById("rows-container");
  const btnCreateList = document.getElementById("btn-create-list");
  const setupGeneralError = document.getElementById("setup-general-error");
  const taskSuggestions = document.getElementById("task-suggestions");

  const executionTitle = document.getElementById("execution-title");
  const executionProgress = document.getElementById("execution-progress");
  const taskListEl = document.getElementById("task-list");

  const reportBody = document.getElementById("report-body");
  const btnDownloadPdf = document.getElementById("btn-download-pdf");
  const btnNewList = document.getElementById("btn-new-list");

  const alertBanner = document.getElementById("alert-banner");
  const alertText = document.getElementById("alert-text");
  const alertDismiss = document.getElementById("alert-dismiss");

  let rowCount = 0;
  let lastCompletedSession = null;

  function showView(view) {
    [viewSetup, viewExecution, viewReport].forEach((v) => (v.hidden = v !== view));
  }

  function setFieldError(fieldId, message) {
    const el = document.querySelector(`.field-error[data-for="${fieldId}"]`);
    const input = document.getElementById(fieldId);
    if (el) el.textContent = message || "";
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function populateSuggestions() {
    taskSuggestions.innerHTML = "";
    Storage.getTaskNameSuggestions().forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      taskSuggestions.appendChild(option);
    });
  }

  function createTaskRow(index) {
    const wrapper = document.createElement("div");
    wrapper.className = "task-row";
    wrapper.innerHTML = `
      <p class="row-title">Tarea ${index}</p>
      <div class="field">
        <label for="task-name-${index}">Nombre de la actividad</label>
        <input type="text" id="task-name-${index}" list="task-suggestions" required>
        <p class="field-error" data-for="task-name-${index}"></p>
      </div>
      <div class="field">
        <label for="task-deadline-${index}">Plazo</label>
        <input type="datetime-local" id="task-deadline-${index}" required>
        <p class="field-error" data-for="task-deadline-${index}"></p>
      </div>
    `;
    return wrapper;
  }

  function generateRows() {
    AlertManager.unlockAudio();
    const count = parseInt(taskCountInput.value, 10);

    if (!count || count < 1 || count > 30) {
      setFieldError("task-count", "Ingresa un número entre 1 y 30.");
      return;
    }
    setFieldError("task-count", "");

    rowsContainer.innerHTML = "";
    rowCount = count;
    for (let i = 1; i <= count; i += 1) {
      rowsContainer.appendChild(createTaskRow(i));
    }
    btnCreateList.disabled = false;
  }

  function validateSetup() {
    let valid = true;

    const listName = listNameInput.value.trim();
    if (!listName) {
      setFieldError("list-name", "Escribe un nombre para la lista del día.");
      valid = false;
    } else {
      setFieldError("list-name", "");
    }

    if (rowCount === 0) {
      setupGeneralError.textContent = "Genera los renglones de tareas antes de continuar.";
      setupGeneralError.hidden = false;
      valid = false;
    } else {
      setupGeneralError.hidden = true;
    }

    const tasks = [];
    for (let i = 1; i <= rowCount; i += 1) {
      const nameInput = document.getElementById(`task-name-${i}`);
      const deadlineInput = document.getElementById(`task-deadline-${i}`);
      const name = nameInput.value.trim();
      const deadlineValue = deadlineInput.value;

      if (!name) {
        setFieldError(`task-name-${i}`, "No puedes dejar esta tarea sin diligenciar.");
        valid = false;
      } else {
        setFieldError(`task-name-${i}`, "");
      }

      if (!deadlineValue) {
        setFieldError(`task-deadline-${i}`, "Fija un plazo para esta tarea.");
        valid = false;
      } else if (new Date(deadlineValue).getTime() <= Date.now()) {
        setFieldError(`task-deadline-${i}`, "El plazo debe ser una fecha futura.");
        valid = false;
      } else {
        setFieldError(`task-deadline-${i}`, "");
      }

      if (name && deadlineValue) {
        tasks.push({
          id: `t${i}-${Date.now()}`,
          name,
          deadline: new Date(deadlineValue).toISOString(),
          createdAt: new Date().toISOString(),
          completedAt: null,
        });
      }
    }

    return { valid, listName, tasks };
  }

  function handleSetupSubmit(event) {
    event.preventDefault();
    AlertManager.unlockAudio();

    const { valid, listName, tasks } = validateSetup();
    if (!valid) return;

    const session = {
      id: `session-${Date.now()}`,
      name: listName,
      createdAt: new Date().toISOString(),
      tasks,
    };

    Storage.saveCurrentSession(session);
    Storage.rememberTaskNames(tasks.map((t) => t.name));
    startExecution(session);
  }

  function getActiveTaskIndex(session) {
    return session.tasks.findIndex((t) => !t.completedAt);
  }

  function renderExecution(session) {
    const activeIndex = getActiveTaskIndex(session);
    const completedCount = session.tasks.filter((t) => t.completedAt).length;

    executionTitle.textContent = session.name;
    executionProgress.textContent = `${completedCount} de ${session.tasks.length} tareas completadas`;

    taskListEl.innerHTML = "";
    session.tasks.forEach((task, index) => {
      const li = document.createElement("li");
      const isCompleted = Boolean(task.completedAt);
      const isActive = index === activeIndex;

      li.className = "task-item";
      if (isCompleted) li.classList.add("is-completed");
      else if (isActive) li.classList.add("is-active");
      else li.classList.add("is-locked");

      const deadlineLabel = new Date(task.deadline).toLocaleString("es-CO");
      li.innerHTML = `
        <div class="task-info">
          <div class="task-name">${task.name}</div>
          <div class="task-deadline">Plazo: ${deadlineLabel}</div>
        </div>
      `;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary";
      button.textContent = isCompleted ? "Completada" : "Marcar como completada";
      button.disabled = isCompleted || !isActive;
      button.addEventListener("click", () => completeTask(session, task.id));
      li.appendChild(button);

      taskListEl.appendChild(li);
    });
  }

  function completeTask(session, taskId) {
    AlertManager.unlockAudio();
    const task = session.tasks.find((t) => t.id === taskId);
    if (!task || task.completedAt) return;

    task.completedAt = new Date().toISOString();
    Storage.saveCurrentSession(session);

    const allDone = session.tasks.every((t) => t.completedAt);
    if (allDone) {
      finishSession(session);
    } else {
      renderExecution(session);
    }
  }

  function finishSession(session) {
    AlertManager.stop();
    hideAlertBanner();
    Storage.archiveSession(session);
    Storage.clearCurrentSession();
    lastCompletedSession = session;
    renderReport(session);
    showView(viewReport);
  }

  function renderReport(session) {
    reportBody.innerHTML = "";
    session.tasks.forEach((task) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${task.name}</td>
        <td>${new Date(task.deadline).toLocaleString("es-CO")}</td>
        <td>${new Date(task.completedAt).toLocaleString("es-CO")}</td>
        <td>${formatDuration(task.createdAt, task.completedAt)}</td>
      `;
      reportBody.appendChild(tr);
    });
  }

  function showAlertBanner(task) {
    alertText.textContent = `Atención: el plazo de "${task.name}" está por vencer o ya venció y aún no la marcas como completada.`;
    alertBanner.hidden = false;
  }

  function hideAlertBanner() {
    alertBanner.hidden = true;
  }

  function startExecution(session) {
    showView(viewExecution);
    renderExecution(session);
    AlertManager.start(
      () => {
        const current = Storage.getCurrentSession();
        if (!current) return null;
        const index = getActiveTaskIndex(current);
        return index === -1 ? null : current.tasks[index];
      },
      (task) => showAlertBanner(task)
    );
  }

  function resetToSetup() {
    formSetup.reset();
    rowsContainer.innerHTML = "";
    rowCount = 0;
    btnCreateList.disabled = true;
    setupGeneralError.hidden = true;
    populateSuggestions();
    showView(viewSetup);
  }

  btnGenerateRows.addEventListener("click", generateRows);
  formSetup.addEventListener("submit", handleSetupSubmit);
  btnDownloadPdf.addEventListener("click", () => {
    if (lastCompletedSession) generateReportPDF(lastCompletedSession);
  });
  btnNewList.addEventListener("click", resetToSetup);
  alertDismiss.addEventListener("click", hideAlertBanner);

  function init() {
    populateSuggestions();
    const current = Storage.getCurrentSession();
    if (current && current.tasks.some((t) => !t.completedAt)) {
      startExecution(current);
    } else {
      showView(viewSetup);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
