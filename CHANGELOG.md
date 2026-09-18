# Registro de cambios

Todos los cambios relevantes de **Gestor de Proceso Disciplinario** se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Por hacer

- Ampliación de la cobertura de pruebas del dominio por encima del 90 %.

---

## [1.0.0] — 2026-09-17

Primera versión pública del laboratorio.

### Agregado

- Módulo **Expedientes**.
- Módulo **Línea de tiempo y términos**.
- Módulo **Actuaciones y pruebas**.
- Módulo **Generador de actos**.
- Módulo **Bitácora de evidencia**.
- Documentación completa en `docs/`: arquitectura, marco normativo, despliegue,
  guía de uso, decisiones de arquitectura y descargo de responsabilidad.
- Integración continua en tres versiones de Node (20, 22 y 24) con formato, análisis
  estático, verificación de tipos, pruebas con cobertura y construcción de producción.
- Despliegue automático en GitHub Pages desde `main`.
- Análisis de seguridad con CodeQL y actualización de dependencias con Dependabot.
- Sistema de diseño NiAnd Labs con modo claro y oscuro y contraste AA.

### Normativo

- Reglas derivadas de **Constitución Política, art. 29**: Debido proceso aplicable a toda actuación administrativa y disciplinaria.
- Reglas derivadas de **Código Sustantivo del Trabajo, art. 115**: Descargos previos a la imposición de sanciones disciplinarias.
- Reglas derivadas de **Ley 2466 de 2025**: Refuerzo de las garantías de debido proceso en el RIT.
- Reglas derivadas de **Sentencia C-593 de 2014**: Garantías mínimas del proceso disciplinario en el sector privado.

> Verificación normativa: 17 de septiembre de 2026.

[No publicado]: https://github.com/AndreZzRg/niand-proceso-disciplinario/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndreZzRg/niand-proceso-disciplinario/releases/tag/v1.0.0
