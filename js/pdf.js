/* Generación del reporte en PDF al completar toda la lista de tareas,
   con las tareas realizadas y el tiempo que tomó cada una. */

function formatDuration(startIso, endIso) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min`;
}

function generateReportPDF(session) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de tareas completadas", 14, 18);
  doc.setFontSize(11);
  doc.text(session.name, 14, 26);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 32);

  let y = 44;
  doc.setFontSize(10);
  doc.text("Tarea", 14, y);
  doc.text("Plazo", 90, y);
  doc.text("Completada", 130, y);
  doc.text("Tiempo", 175, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;

  session.tasks.forEach((task) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(task.name, 14, y, { maxWidth: 72 });
    doc.text(new Date(task.deadline).toLocaleString("es-CO"), 90, y, { maxWidth: 36 });
    doc.text(new Date(task.completedAt).toLocaleString("es-CO"), 130, y, { maxWidth: 40 });
    doc.text(formatDuration(task.createdAt, task.completedAt), 175, y);
    y += 10;
  });

  const fileSafeName = session.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`reporte-${fileSafeName || "tareas"}.pdf`);
}
