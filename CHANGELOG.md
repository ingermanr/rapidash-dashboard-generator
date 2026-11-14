# Changelog

## [Unreleased]

### Infraestructura
- Script `verify` (typecheck + lint + tests + build) como verificación local antes de cada PR. Se retiró el workflow de GitHub Actions porque la cuenta no puede ejecutar Actions.
- Nuevos scripts `typecheck` y `verify`; `lint` usa ESLint directamente con `--max-warnings=0`.
- ESLint migrado a flat config (`eslint.config.mjs`) con `next/core-web-vitals` y `next/typescript`.
- npm como único gestor de paquetes (eliminado `pnpm-lock.yaml`).
- Node 24 LTS vía `.nvmrc` (`engines.node >=20.9`); eliminado el pin de Volta a Node 18 (EOL).
- Finales de línea LF forzados con `.gitattributes`.

### Limpieza
- Eliminadas 37 dependencias y 44 componentes de `components/ui` que no se usaban.
- Eliminadas ~800 líneas de layouts y helpers de PDF que no se usaban en la vista detallada.
- Eliminados los `console.log` de depuración.

### Arquitectura
- La lógica de generación (combinaciones, layouts y paletas) y los datos de ejemplo viven en `lib/domain/`, sin dependencias de React y con tests unitarios.
- Aleatoriedad inyectable con `createSeededRandom`: la generación es reproducible en tests.
- `app/page.tsx` quedó en 51 líneas: elige entre `LandingView`, `BuilderView` y `VariantDetailView` (`components/generator/`).
- La vista detallada pasó de un archivo de 2841 líneas a un contenedor de 234 líneas más componentes en `components/dashboard-preview/` (un archivo por gráfico) y la exportación a PDF en `lib/pdf/`.

### Correcciones
- Los datos de ejemplo de cada gráfico ya no cambian en cada re-render (por ejemplo al usar filtros o cambiar el tema): se generan con una semilla derivada del id de la combinación.
- Los errores al generar el PDF se muestran con una notificación en lugar de un `alert()` que bloqueaba la página.
- Las variables con "trimestre" en el nombre muestran trimestres (Q1-Q4) en lugar de meses.
- Los dashboards con 11 a 15 visualizaciones usan los layouts pensados para ese rango; antes caían en los layouts para 31 o más.
- El layout "Staggered" ya no superpone tarjetas desde la sexta visualización.
- Las notificaciones (toasts) ahora se muestran: faltaba montar `<Toaster />` en el layout raíz.
- Generar una variante ahora respeta las combinaciones excluidas agregadas después de cargar las variables (closure desactualizado en `useCallback`).
- Corregidos los errores de tipos en los fixtures de tests.

## [Limpieza de Producción] - 2025-10-13

### ✨ Mejoras

#### Documentación
- ✅ **Unificado** toda la documentación en un único `README.md` completo y profesional
- ✅ **Eliminados** 9 archivos .md temporales de desarrollo:
  - `CONSISTENCY_IMPROVEMENTS.md`
  - `HIGH_DENSITY_LAYOUTS_COMPLETE.md`
  - `LAYOUT_FLOW.md`
  - `LAYOUT_OPTIMIZATION.md`
  - `LAYOUT_SYNC_COMPLETE.md`
  - `SCALING_OPTIMIZATIONS.md`
  - `TESTING_GUIDE.md`
  - `UI_IMPROVEMENTS_DASHBOARD.md`
  - `VERIFICATION_COMPLETE.md`

#### Tests
- ✅ **Simplificados** los tests de generación de PDF
- ✅ **Eliminados** 7 archivos de test temporales:
  - `debug-pdf.js`
  - `layout-test.js`
  - `test-high-density-layouts.js`
  - `test-layouts.mjs`
  - `test-pdf.js`
  - `verify-layouts.mjs`
  - `visual-test.js`
- ✅ **100% de tests pasando** (28/28 tests)

#### Configuración
- ✅ **Actualizado** `.gitignore` para ignorar:
  - Archivos PDF generados
  - Ejecutables (.exe)
  - Archivos de test temporales
  - Coverage reports
  - Backups de documentación

#### Build
- ✅ **Verificado** build de producción exitoso
- ✅ **Optimizado** para deployment
- ✅ Sin errores críticos

### 📊 Estado del Proyecto

**Tests**: ✅ 28/28 passing (100%)  
**Build**: ✅ Successful  
**TypeScript**: ✅ No critical errors  
**Estructura**: ✅ Limpia y organizada

### 📁 Estructura Final

```
dashboard-generator/
├── app/                    # Next.js App Router
├── components/             # Componentes React + UI
├── lib/                    # Lógica de negocio
├── store/                  # Estado global (Zustand)
├── types/                  # TypeScript definitions
├── hooks/                  # React hooks
├── __tests__/              # Suite de tests
├── public/                 # Assets estáticos
├── styles/                 # Estilos globales
├── README.md               # Documentación completa
├── package.json            # Dependencias
├── tsconfig.json           # Config TypeScript
├── jest.config.js          # Config Jest
└── .gitignore              # Git ignore actualizado
```

### 🚀 Próximos Pasos

El proyecto está **listo para producción**. Recomendaciones:

1. **Deployment**: Desplegar en Vercel o plataforma similar
2. **CI/CD**: Configurar pipeline de integración continua
3. **Monitoreo**: Agregar analytics y error tracking
4. **Performance**: Implementar métricas de rendimiento

### 📝 Notas

- Todos los archivos temporales de desarrollo han sido eliminados
- La documentación está consolidada y actualizada
- Los tests están optimizados y pasando al 100%
- El proyecto está limpio y listo para compartir/desplegar

---

**Autor**: Rapidash Team  
**Fecha**: 13 de Octubre, 2025
