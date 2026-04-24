import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Eye, ArrowRight, Github, Phone } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.2 + i * 0.12, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface">

      {/* ══════════════════════════════════════════
          SECCIÓN 1 — Hero de Misión
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-10 pb-20 px-8 max-w-7xl mx-auto">
        {/* Blob decorativo */}
        <div
          className="absolute -top-10 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none -z-10"
          style={{ background: 'radial-gradient(circle, rgba(0,73,37,0.06) 0%, transparent 70%)' }}
        />

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <span className="label-md text-secondary block mb-6">MISIÓN ACADÉMICA</span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="display-lg text-on-surface max-w-3xl mb-6"
        >
          Transformamos el{' '}
          <span className="italic text-primary">caos del SGA</span>{' '}
          en herramientas accionables.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="body-lg text-on-surface-variant max-w-2xl mb-10 leading-relaxed"
        >
          Inforario nació en las aulas de la Universidad Técnica de Manabí. Cansados de reportes PDF 
          ilegibles y horarios que no caben en la pantalla, decidimos construir la herramienta que 
          siempre quisimos tener: rápida, precisa y que se vea tan bien que quieras compartirla.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-start gap-4"
        >
          <a
            href="https://wa.me/593979107716?text=Hola,%20quiero%20saber%20más%20sobre%20Inforario"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg shadow-editorial hover:scale-105 active:scale-95 transition-transform duration-200"
            id="about-hero-cta"
          >
            Explorar el Proyecto
            <ArrowRight size={18} />
          </a>
          <a
            href="https://github.com/DavidCevallos15"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 font-semibold px-4 py-4"
          >
            <Github size={18} />
            Ver en GitHub
          </a>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          SECCIÓN 2 — Bento Grid: El Pasado vs La Solución
      ══════════════════════════════════════════ */}
      <section className="px-8 py-10 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          custom={0}
          className="mb-8"
        >
          <span className="label-md text-secondary block mb-3">EVOLUCIÓN DIGITAL</span>
          <h2 className="headline-md text-on-surface">Del pasado al presente académico.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* El Pasado — 5 cols */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            custom={1}
            className="md:col-span-5 bg-surface-container-low rounded-[1.5rem] p-8 editorial-shadow hover:shadow-editorial-lg transition-all duration-300"
          >
            <div className="inline-flex items-center gap-2 bg-error-container/60 text-on-error-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-error rounded-full" />
              El Pasado
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-4">SGA Tradicional</h3>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Tablas HTML sin estilo. PDFs que hay que imprimir. Sin colores, sin interactividad, 
              sin exportación. Acceder al horario significaba sufrir el portal universitario.
            </p>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              {['Interfaz de los años 2000', 'Solo disponible en web de escritorio', 'Sin exportación a calendario', 'Imposible personalizar'].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 mt-0.5 rounded-full bg-error-container text-error flex items-center justify-center text-[10px] font-bold shrink-0">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* La Solución — 7 cols */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            custom={2}
            className="md:col-span-7 bg-primary text-on-primary rounded-[1.5rem] p-8 editorial-shadow-lg hover:shadow-[0_32px_64px_rgba(0,73,37,0.2)] transition-all duration-300 relative overflow-hidden"
          >
            {/* Decoración blob interna */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #a1f5b8 0%, transparent 70%)' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-on-secondary-container rounded-full animate-pulse-utm" />
                  La Solución
                </div>
              </div>

              <h3 className="text-2xl font-bold text-on-primary mb-4">Inforario v3.0</h3>
              <p className="text-on-primary-container leading-relaxed mb-6">
                Carga tu PDF del SGA y en segundos tienes un horario digital interactivo, con colores, 
                exportación a .ics para Google Calendar, PDF de alta calidad y personalización completa.
              </p>

              <ul className="space-y-3 text-sm">
                {[
                  'Extracción automática desde PDF del SGA',
                  'Exportación a Google Calendar (.ics)',
                  'Descarga PDF de alta calidad',
                  'Personalización de colores por materia',
                  'Guardado automático en la nube',
                  'Detección de conflictos de horario',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-on-primary-container">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECCIÓN 3 — Valores
      ══════════════════════════════════════════ */}
      <section className="px-8 py-16 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          custom={0}
          className="mb-10"
        >
          <span className="label-md text-secondary block mb-3">NUESTROS VALORES</span>
          <h2 className="headline-md text-on-surface">Lo que nos guía.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Users size={26} />,
              title: 'De estudiantes, para estudiantes',
              description: 'Diseñado desde la experiencia real en aulas de la UTM. Sin suposiciones, con empatía genuina por quienes lo usan a diario.',
            },
            {
              icon: <Zap size={26} />,
              title: 'Precisión & Velocidad',
              description: 'El parser procesa tu PDF del SGA en segundos con alta precisión. Tu tiempo vale, y lo respetamos.',
            },
            {
              icon: <Eye size={26} />,
              title: 'Excelencia Visual',
              description: 'Un horario universitario puede ser hermoso. Demostramos que la funcionalidad y el diseño premium no son opuestos.',
            },
          ].map((value, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={i + 1}
              className="group bg-surface-container-low hover:bg-surface-container rounded-[1.5rem] p-8 transition-all duration-300 editorial-shadow hover:shadow-editorial-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-6 group-hover:scale-110 transition-transform duration-300">
                {value.icon}
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-3">{value.title}</h4>
              <p className="text-on-surface-variant leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECCIÓN 4 — Estadísticas de Impacto
      ══════════════════════════════════════════ */}
      <section className="px-8 py-10 max-w-7xl mx-auto pb-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          custom={0}
          className="bg-surface-container-low rounded-[2.5rem] p-12 editorial-shadow-lg"
        >
          <div className="text-center mb-12">
            <span className="label-md text-secondary block mb-3">IMPACTO ACADÉMICO</span>
            <h2 className="headline-md text-on-surface">Números que importan.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              { value: '15k+', label: 'Horarios Generados', sub: 'desde el lanzamiento' },
              { value: '98%', label: 'Precisión del Parser', sub: 'en PDFs del SGA UTM' },
              { value: '3', label: 'Facultades', sub: 'Universidad Técnica de Manabí' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                custom={i + 1}
                className="flex flex-col items-center"
              >
                <span className="text-5xl font-extrabold text-primary tracking-tighter mb-2">{stat.value}</span>
                <span className="text-lg font-bold text-on-surface mb-1">{stat.label}</span>
                <span className="text-sm text-on-surface-variant">{stat.sub}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          Footer de About — Desarrollador
      ══════════════════════════════════════════ */}
      <section className="px-8 py-12 max-w-7xl mx-auto text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <p className="text-sm text-on-surface-variant mb-2">Desarrollado con pasión por</p>
          <p className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">David Cevallos Zambrano</p>
          <p className="text-sm text-on-surface-variant mb-6">Estudiante de Ingeniería en TI — UTM · Portoviejo, Ecuador</p>

          <div className="flex justify-center gap-4">
            <a
              href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold text-sm shadow-editorial hover:scale-105 transition-transform duration-200"
            >
              <Phone size={16} />
              Feedback WhatsApp
            </a>
            <a
              href="https://github.com/DavidCevallos15"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 font-semibold px-4 py-3"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
