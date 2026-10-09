import React from 'react';
import { Reveal } from './notebook/Reveal';
import { InkCircle } from './notebook/InkCircle';

const FAQ = [
  {
    q: '¿Necesito una cuenta?',
    a: 'No. Sin cuenta, tu horario queda guardado en este navegador. Con tu correo @utm.edu.ec se guarda en tu cuenta y lo ves en cualquier dispositivo.',
  },
  {
    q: '¿Funciona con cualquier facultad?',
    a: 'Lee el formato actual del reporte del SGU, que es el mismo para todas las facultades. Si tu horario no sale bien, escríbeme desde "Enviar comentarios" al pie de la página.',
  },
  {
    q: '¿Cómo lo paso a Google Calendar?',
    a: 'Desde Exportar, descarga el archivo .ics y ábrelo: funciona con Google Calendar, Apple Calendar y Outlook. La sincronización directa con Google requiere iniciar sesión.',
  },
  {
    q: '¿Qué pasa si tengo un choque de horario?',
    a: 'Las clases que se cruzan se marcan en rojo. Desde el detalle de la clase puedes quitarla de tu horario.',
  },
  {
    q: '¿Es una aplicación oficial de la UTM?',
    a: 'No. Es un proyecto estudiantil independiente: usa el reporte que tú descargas del SGU, pero no está conectado a los sistemas de la universidad.',
  },
];

const AboutPage: React.FC = () => (
  <article className="mx-auto max-w-3xl pb-20 pt-8 sm:pt-14">
    <Reveal>
      <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-on-surface sm:text-5xl">Cómo funciona</h1>
      <p className="mt-4 max-w-[60ch] text-lg leading-8 text-on-surface-variant">
        Inforario convierte el reporte de horarios del SGU, pensado para imprimir, en una semana que se lee de un vistazo en
        el celular.
      </p>
    </Reveal>

    <section className="mt-14" aria-labelledby="pdf-title">
      <Reveal>
        <h2 id="pdf-title" className="text-2xl font-extrabold text-on-surface sm:text-3xl">
          De dónde sale el PDF
        </h2>
      </Reveal>
      <ol className="mt-6 space-y-6">
        {[
          'Entra al SGU de la UTM con tu usuario.',
          'Busca el reporte Horario de clases del período actual y descárgalo en PDF. Es el que trae tu período, tu facultad y la tabla de asignaturas con docentes y aulas.',
          'Súbelo en la portada de Inforario. No tienes que copiar nada a mano.',
        ].map((text, i) => (
          <li key={text} className="flex items-start gap-3">
            <InkCircle delay={i * 0.1}>{i + 1}</InkCircle>
            <p className="max-w-[58ch] pt-2.5 text-base leading-7 text-on-surface">{text}</p>
          </li>
        ))}
      </ol>
    </section>

    <section className="mt-16" aria-labelledby="privacidad-title">
      <Reveal>
        <h2 id="privacidad-title" className="text-2xl font-extrabold text-on-surface sm:text-3xl">
          Qué pasa con tus datos
        </h2>
        <div className="mt-5 space-y-4 text-base leading-7 text-on-surface">
          <p className="max-w-[62ch]">
            El PDF se lee <span className="highlight">en tu propio dispositivo</span>. El reporte incluye tu nombre y tu cédula,
            y esos datos no se guardan en ningún lado.
          </p>
          <p className="max-w-[62ch] text-on-surface-variant">
            Si el formato del reporte no se reconoce, se usa un lector de respaldo con inteligencia artificial, al que se le
            envía solo la tabla de materias, sin nombre, cédula ni código de matrícula. Si inicias sesión, se guarda tu
            horario (materias, horas y aulas) en tu cuenta.
          </p>
        </div>
      </Reveal>
    </section>

    <section className="mt-16" aria-labelledby="entiende-title">
      <Reveal>
        <h2 id="entiende-title" className="text-2xl font-extrabold text-on-surface sm:text-3xl">
          Qué entiende del reporte
        </h2>
        <dl className="mt-5 divide-y divide-outline-variant">
          {[
            ['Aula y piso', 'A partir del código de ambiente, por ejemplo 1-59-2-04 es el aula 204 del piso 2.'],
            ['Edificio', 'Del campo LUGAR: Ciencias Informáticas, Ciencias Básicas, Filosofía, etc.'],
            ['Varias páginas', 'Junta todas las materias aunque el reporte ocupe dos hojas.'],
            ['Materias sin horario', 'Las que el SGU marca como horario no asignado aparecen aparte, sin perderse.'],
          ].map(([title, text]) => (
            <div key={title} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="ink text-xl font-bold leading-7">{title}</dt>
              <dd className="max-w-[56ch] text-base leading-7 text-on-surface-variant">{text}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>

    <section className="mt-16" aria-labelledby="faq-title">
      <Reveal>
        <h2 id="faq-title" className="text-2xl font-extrabold text-on-surface sm:text-3xl">
          Preguntas frecuentes
        </h2>
      </Reveal>
      <dl className="mt-6 divide-y divide-outline-variant">
        {FAQ.map(({ q, a }) => (
          <div key={q} className="py-5">
            <dt className="text-lg font-extrabold text-on-surface">{q}</dt>
            <dd className="mt-2 max-w-[62ch] text-base leading-7 text-on-surface-variant">{a}</dd>
          </div>
        ))}
      </dl>
    </section>

    <p className="mt-14 text-base text-on-surface-variant">
      Hecho por{' '}
      <a
        href="https://github.com/DavidCevallos15"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary underline decoration-primary/40 hover:decoration-primary"
      >
        DC.dev
      </a>
      , estudiante de Tecnologías de la Información en la UTM.
    </p>
  </article>
);

export default AboutPage;
