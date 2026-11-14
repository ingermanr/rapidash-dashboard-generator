# 📊 Rapidash Dashboard Generator

> **Generador inteligente de dashboards** con múltiples variantes de layouts, visualizaciones de datos y exportación a PDF.
> 
> *Creado con [v0 by Vercel](https://v0.dev)*

![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)

---

## ✨ Características

### 🎨 **Interfaz Moderna**
- **Diseño glassmorphism** con gradientes animados
- **Tema dark/light** con persistencia de preferencias
- **Animaciones fluidas** y transiciones suaves
- **Responsive** - Adaptado para desktop, tablet y móvil

### 📈 **Sistema de Variables**
Soporta múltiples tipos de variables:
- **Numérica** - Para valores cuantitativos
- **Categórica** - Para clasificaciones
- **Temporal** - Para series de tiempo
- **Porcentaje** - Progreso o ratios
- **Texto** - Datos cualitativos
- **Binaria** - Valores booleanos

### 🎯 **Motor de Layouts Inteligente**
- **9+ patrones de layout** prediseñados
- **Sistema de grid de 12 columnas**
- **Generación aleatoria inteligente** sin duplicados
- **Análisis de calidad** de layouts
- **Exclusión de combinaciones** no deseadas

#### Patrones de Layout Disponibles:
- `Grid` - Grid simple de 3 columnas
- `Hero + Grid` - Elemento destacado + grid
- `Compact Grid` - Alta densidad de información
- `Focus Grid` - Área de enfoque + componentes secundarios
- `Asymmetric` - Diseño asimétrico moderno
- `Priority Layout` - Basado en prioridad de variables
- `Column Layout` - Columnas verticales
- `High Density Grid` - Máxima utilización del espacio
- `Dynamic Dashboard` - Adaptativo según contenido

### 📊 **Visualizaciones de Datos**
Tipos de gráficos soportados:
- Barras (vertical/horizontal)
- Líneas y Áreas
- Pie/Donut
- Radial/Progress
- Métricas numéricas

#### Paletas de Colores:
- Professional Blue
- Vibrant Rainbow
- Warm Sunset
- Cool Ocean
- Earth Tones

### 📄 **Exportación a PDF**
- Especificaciones completas del dashboard
- Visualización del grid layout
- Información detallada de variables
- Combinaciones de datos
- Header y footer profesionales

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** 24 LTS (ver `.nvmrc`; mínimo 20.9)
- **npm** (único gestor de paquetes; el lockfile es `package-lock.json`)

### Instalación

```bash
git clone https://github.com/ingermanr/rapidash-dashboard-generator.git
cd rapidash-dashboard-generator
nvm use        # opcional, usa la versión de .nvmrc
npm ci
```

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint con cero warnings permitidos |
| `npm test` | Tests con Jest |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Reporte de cobertura |
| `npm run verify` | Typecheck + lint + tests + build |

### Antes de cada PR

No hay CI remoto: ejecuta `npm run verify` y asegúrate de que pase antes de abrir o mergear un PR.

---

## 📁 Estructura del Proyecto

```
dashboard-generator/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Página principal
│   └── globals.css          # Estilos globales
│
├── components/              # Componentes React
│   ├── dashboard-detailed-preview.tsx  # Vista detallada
│   ├── layout-preview.tsx              # Preview de layouts
│   ├── variable-input.tsx              # Input de variables
│   ├── theme-toggle.tsx                # Toggle de tema
│   └── ui/                             # Primitivas UI (shadcn/ui + Radix)
│
├── lib/                     # Lógica de negocio
│   ├── layout-engine.ts     # Motor de generación de layouts
│   └── utils.ts             # Utilidades
│
├── store/                   # Estado global (Zustand)
│   ├── dashboard-store.ts   # Store principal
│   ├── hooks.ts             # Hooks personalizados
│   └── index.ts             # Exports
│
├── types/                   # TypeScript types
│   └── dashboard.ts         # Tipos del dashboard
│
├── hooks/                   # React hooks
│   └── use-toast.ts         # Sistema de toasts
│
├── __tests__/               # Tests
│   ├── components/          # Tests de componentes
│   ├── lib/                 # Tests de utilidades
│   └── types/               # Tests de tipos
│
└── public/                  # Assets estáticos
    └── manifest.json        # PWA manifest
```

---

## 🎯 Uso

### 1. **Crear Variables**
1. Ingresa el nombre de la variable
2. Selecciona el tipo de dato
3. Define la prioridad (alta/media/baja)
4. Agrega la variable

### 2. **Excluir Combinaciones** (Opcional)
- Selecciona variables que no deben combinarse
- Agrega una descripción del por qué
- El sistema respetará estas exclusiones

### 3. **Generar Layouts**
1. Click en "Generar Dashboard Variants"
2. El sistema genera variantes únicas e inteligentes
3. Cada variante incluye:
   - Patrón de layout optimizado
   - Paleta de colores
   - Combinaciones de variables
   - Tipos de visualizaciones

### 4. **Explorar Variantes**
- Visualiza múltiples opciones de layout
- Compara diferentes enfoques
- Analiza las combinaciones propuestas

### 5. **Vista Detallada**
- Click en cualquier variante para ver detalles
- Filtros dinámicos interactivos
- Métricas principales destacadas
- Preview completo del dashboard

### 6. **Exportar a PDF**
- Click en "Descargar PDF"
- Obtén especificaciones completas
- Listas para compartir con desarrolladores

---

## 🏗️ Arquitectura

### **Motor de Layouts**
El corazón del sistema es `lib/layout-engine.ts`:

```typescript
// Sistema de grid de 12 columnas
export const GRID_CONFIG = {
  COLUMNS: 12,
  MIN_COMPONENT_WIDTH: 3,
  MIN_COMPONENT_HEIGHT: 1,
  DEFAULT_HEIGHT: 1,
}

// Generación de divisiones del layout
getRealLayoutDivisions(layout: string, count: number): LayoutDivision[]

// Análisis de calidad
analyzeLayoutQuality(layout: string, combinations: VariableCombination[]): number
```

### **Estado Global con Zustand**
Gestión eficiente del estado con persistencia:

```typescript
// Variables y configuración
const { variables, excludedCombinations } = useVariables()

// Layouts y variantes
const { currentVariant, generationHistory, selectedVariant } = useLayouts()

// Información del dashboard
const { dashboardTitle, dashboardDescription } = useDashboardInfo()
```

### **Sistema de Tipos**
TypeScript completo para type-safety:

```typescript
interface Variable {
  id: string
  name: string
  type: VariableType
  priority: VariablePriority
}

interface LayoutVariant {
  id: string
  layout: string
  palette: ColorPalette
  variables: Variable[]
  combinations: VariableCombination[]
}
```

---

## 🧪 Testing

### Cobertura Actual
- ✅ Tests de componentes
- ✅ Tests de utilidades
- ✅ Tests de tipos

### Suite de Tests
```bash
__tests__/
├── components/
│   ├── pdf-generation.test.tsx
│   └── variable-input.test.tsx
├── lib/
│   └── utils.test.ts
└── types/
    └── dashboard.test.ts
```

---

## 🎨 Componentes UI

Las primitivas viven en `components/ui/` (estilo shadcn/ui sobre Radix): `Badge`, `Button`, `Card`, `Input`, `Select`, `Textarea` y `Toast`. Solo se mantienen las que se usan; para agregar otra, usa `npx shadcn@latest add <componente>` (la configuración está en `components.json`).

---

## 🔧 Configuración

### **Tailwind CSS**
Configuración en `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### **TypeScript**
Configuración estricta en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve"
  }
}
```

### **Jest**
Testing configurado con JSDOM:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  }
}
```

---

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Build Manual
```bash
# Construir
npm run build

# El output estará en .next/
# Servir con
npm start
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| Next.js | 15.5.7 | Framework React |
| React | 19 | UI Library |
| TypeScript | 5 | Type Safety |
| Tailwind CSS | 4.1.9 | Styling |
| Zustand | 5.0.8 | State Management |
| Radix UI | Latest | UI Components |
| Recharts | 3.2.1 | Visualizaciones |
| jsPDF | 3.0.3 | PDF Export |
| Jest | 30.2.0 | Testing |

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Germán Alonso Rodríguez** - [@ingermanr](https://github.com/ingermanr)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

**¿Preguntas o sugerencias?** Abre un issue o contacta al equipo de desarrollo.
