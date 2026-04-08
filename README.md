# 🎓 Inforario v2.0 | Inteligencia Académica UTM

![Inforario Banner](https://img.shields.io/badge/Estado-Producci%C3%B3n-success?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Inforario v2.0** es un sistema inteligente desarrollado para la Universidad Técnica de Manabí (UTM), diseñado específicamente para leer, extraer, unificar y embellecer reportes de horarios académicos generados por el Sistema de Gestión Académica (SGA). Convirtiendo aburridos documentos PDF en agendas interactivas, estéticas y fácilmente exportables.

## ✨ Características Principales

- **⚙️ Parser 100% Local (Sin AI / Sin APIs):** Extracción precisa directamente en el dispositivo del cliente. No se comprometen datos ni se depende de facturaciones en la nube, usando lecturas exactas de coordenadas (x,y) nativas en JavaScript puro mediante `pdfjs-dist`.
- **💥 Resolución Automática de Conflictos (Choques):** Si la malla genera un cruce de materias en horas o aulas concurrentes, el algoritmo fusiona de manera limpia los datos, alertando al usuario sobre el "Choque" sin que haya elementos visuales encimados ni se corrompa la cuadrícula.
- **📅 Sincronización Universal (.ics):** Olvídate de los procesos tediosos. Exporta rápidamente todo el ciclo semestre hacia *Google Calendar, Outlook o Apple Calendar*. Generación del formato `.ics` para programar una recurrencia universal, gratuita y libre de tokens/APIs.
- **📱 Responsividad Extrema & UI/UX Premium:** Experiencia y visualización fluida, sin importar si estás en móvil o PC. Navegación difuminada (glassmorphism), carruseles limpios y botones altamente depurados orientados a reducir la fricción del usuario.
- **📄 Exportación a PDF de Alta Calidad:** Un solo clic para producir un PDF limpio, en alta calidad y listo para imprimir (`jsPDF`).

---

## 🛠 Instalación y Configuración

El proyecto de React está diseñado y acoplado con **Vite** para desarrollo ultra rápido. Para levantarlo en tu entorno local:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/DavidCevallos15/inforario-IA-null.git
   cd inforario-IA-null
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo en caliente (Hot Reload):**
   ```bash
   npm run dev
   ```

4. *Si deseas compilar la versión empaquetada para producción en un VPS o host:*
   ```bash
   npm run build
   ```

---

## 💻 Tech Stack Central

- **Core:** React 18 + Vite (Frontend Web)
- **Lenguaje Transpilado:** TypeScript
- **Framework de Estilos:** Tailwind CSS 
- **Gráficos e Iconos:** Lucide-React
- **Animaciones Complejas:** Framer Motion
- **Procesamiento PDF:** librerías web-workers basadas en `pdfjs-dist` y `jspdf`

---

## 👨‍💻 Acerca del Autor

**David Cevallos Zambrano**  
*Estudiante de Ingeniería en Tecnología de la Información | Universidad Técnica de Manabí*  

- [GitHub Profile](https://github.com/DavidCevallos15)
- El aplicativo incluye una opción para brindar feedback (Feedback / Experiencia).
- Ideal como proyecto representativo de 9no semestre (Estructura de Datos, Parseo Complejo e Integración de Front moderno). 

> **Hecho con pasión para optimizar el tiempo estudiantil. 🚀**
