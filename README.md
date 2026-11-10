# Checklist de Tareas

Aplicación web para gestionar la lista de tareas del día: se crea con un
número fijo de actividades y un plazo para cada una, se avanza en orden
estricto (no se puede iniciar la siguiente tarea sin completar la anterior),
avisa con sonido y vibración cuando un plazo está por vencer sin confirmar
el cumplimiento, y al terminar toda la lista genera un reporte en PDF con
las tareas realizadas y el tiempo que tomó cada una.

## Estructura del proyecto

```
checklist-tareas/
├── index.html          Estructura de las 3 vistas (crear, ejecutar, reporte)
├── css/
│   └── styles.css       Estilos (claro/oscuro automático)
└── js/
    ├── storage.js        Persistencia en localStorage (sesión actual, historial, sugerencias)
    ├── alerts.js         Monitoreo del plazo + sonido y vibración
    ├── pdf.js             Generación del reporte PDF (usa jsPDF por CDN)
    └── app.js              Lógica de interfaz y reglas de negocio
```

No requiere backend ni proceso de build: es HTML/CSS/JS plano. La única
dependencia externa es [jsPDF](https://github.com/parallax/jsPDF), cargada
desde CDN en `index.html`.

## Cómo probarla localmente

Al ser archivos estáticos, basta con servirlos (abrir `index.html`
directamente también funciona, pero un servidor local evita restricciones
de algunos navegadores):

```bash
cd checklist-tareas
python3 -m http.server 8080
```

Luego abre `http://localhost:8080` en el navegador.

## Reglas implementadas

- No se puede crear la lista si falta el nombre de la lista, el nombre de
  alguna tarea o su plazo (validación en `app.js`, función `validateSetup`).
- El plazo de cada tarea debe ser una fecha futura al crearla.
- Las tareas se sugieren con autocompletado a partir del historial del
  mismo dispositivo; si no hay historial, el campo queda vacío sin sugerencias.
- Solo la primera tarea pendiente está activa; las demás aparecen
  bloqueadas hasta que la anterior se marque como completada.
- Mientras la tarea activa esté a 5 minutos o menos de su plazo (o ya
  vencida) sin marcarse como completada, se repite una alerta sonora y de
  vibración cada minuto, en el mismo dispositivo donde está abierta la sesión.
- Al completar la última tarea se genera el reporte y queda disponible el
  botón para descargarlo en PDF.

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Checklist de tareas: versión inicial"
git branch -M main
git remote add origin <URL-de-tu-repositorio>
git push -u origin main
```

Luego, en GitHub: **Settings → Pages → Branch: main → / (root)**. La app
quedará publicada en `https://<usuario>.github.io/<repositorio>/`.

## Limitaciones conocidas

- Las alertas solo funcionan mientras la pestaña está abierta en ese
  dispositivo (no hay notificaciones push ni backend).
- El sonido de alerta requiere que el Usuario haya interactuado antes con
  la página (política de los navegadores); por eso se habilita al generar
  los renglones o crear la lista.
- La vibración solo está disponible en navegadores móviles compatibles con
  la Vibration API (por ejemplo, Chrome en Android); en escritorio o iOS
  solo se escuchará el sonido.
