import {
  componentRows,
  diagramBoxes,
  pdfFileName,
  readableTextColor,
  variableRows,
  type Area,
} from "@/lib/pdf/spec-content"
import type { LayoutVariant } from "@/types/dashboard"

export interface DashboardSpecPdfInput {
  variant: LayoutVariant
  title: string
  description: string
}

/* A4 portrait, millimetres. */
const MARGIN = 18
const HEADER_BOTTOM = 26
const FOOTER_TOP = 282

const BRAND = "#0054ee"
const INK = "#0f172a"
const MUTED = "#64748b"
const LINE = "#e2e8f0"
const SURFACE = "#f8fafc"

const SECTIONS = ["Layout", "Componentes", "Variables", "Paleta de colores"] as const
type Section = (typeof SECTIONS)[number]

const PALETTE_ROLES = ["Principal", "Secundario", "Acento", "Datos", "Complemento"]

interface Column<Row> {
  header: string
  width: number
  value: (row: Row) => string
  align?: "left" | "right"
  /** Optional colour chip drawn before the value. */
  chip?: (row: Row) => string
}

function rgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : [0, 0, 0]
}

/**
 * Draws the specification PDF: a summary page with a real index, then the layout diagram, the components,
 * the variables and the palette. Every page carries "Página X de N". Throws if generation fails.
 */
export async function exportDashboardSpecPdf({ variant, title, description }: DashboardSpecPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - MARGIN * 2
  const right = pageWidth - MARGIN
  const shownTitle = title.trim() || "Dashboard sin título"
  const generatedOn = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  const sectionPages = new Map<Section, number>()
  let y = MARGIN

  const fill = (hex: string) => doc.setFillColor(...rgb(hex))
  const stroke = (hex: string) => doc.setDrawColor(...rgb(hex))
  const ink = (hex: string) => doc.setTextColor(...rgb(hex))
  const font = (size: number, weight: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", weight)
    doc.setFontSize(size)
  }
  const currentPage = () => doc.getCurrentPageInfo().pageNumber

  /** Shortens `text` with an ellipsis until it fits `width` in the current font. */
  const fit = (text: string, width: number) => {
    if (doc.getTextWidth(text) <= width) return text
    let cut = text
    while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > width) cut = cut.slice(0, -1)
    return `${cut.trimEnd()}…`
  }

  /** Wraps `text` to `width`, keeping at most `maxLines` (the last one gets an ellipsis if cut). */
  const wrap = (text: string, width: number, maxLines = Infinity): string[] => {
    const lines: string[] = doc.splitTextToSize(text, width)
    const fitted = lines.map((line) => fit(line, width))
    if (fitted.length <= maxLines) return fitted
    const kept = fitted.slice(0, maxLines)
    kept[maxLines - 1] = fit(`${kept[maxLines - 1]}…`, width)
    return kept
  }

  const drawLogo = (x: number, top: number, size: number) => {
    const s = size / 256
    fill(BRAND)
    doc.roundedRect(x, top, size, size, 56 * s, 56 * s, "F")
    fill("#ffffff")
    const tile = (tx: number, ty: number, w: number, h: number) => doc.roundedRect(x + tx * s, top + ty * s, w * s, h * s, 12 * s, 12 * s, "F")
    tile(48, 48, 160, 44)
    tile(48, 108, 92, 100)
    tile(156, 108, 52, 42)
    tile(156, 166, 52, 42)
    fill(BRAND)
    for (const [bx, by, bh] of [[64, 166, 26], [87, 146, 46], [110, 124, 68]]) doc.rect(x + bx * s, top + by * s, 14 * s, bh * s, "F")
  }

  /** Small running header on every page after the summary. */
  const drawRunningHeader = () => {
    drawLogo(MARGIN, 12, 6)
    font(9, "bold")
    ink(INK)
    doc.text("Rapidash", MARGIN + 8.5, 16.4)
    font(9)
    ink(MUTED)
    const label = fit(shownTitle, contentWidth - 40)
    doc.text(label, right, 16.4, { align: "right" })
    stroke(LINE)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, 21, right, 21)
  }

  const newPage = () => {
    doc.addPage()
    drawRunningHeader()
    y = HEADER_BOTTOM + 4
  }

  /** Starts a new page when `height` more millimetres would run into the footer. */
  const ensureSpace = (height: number) => {
    if (y + height > FOOTER_TOP - 6) {
      newPage()
      return true
    }
    return false
  }

  const sectionHeading = (section: Section, intro?: string) => {
    newPage()
    sectionPages.set(section, currentPage())
    const number = String(SECTIONS.indexOf(section) + 1).padStart(2, "0")
    font(9, "bold")
    ink(BRAND)
    doc.text(number, MARGIN, y + 4)
    font(18, "bold")
    ink(INK)
    doc.text(section, MARGIN + 9, y + 4)
    y += 10
    if (intro) {
      font(10)
      ink(MUTED)
      const lines = wrap(intro, contentWidth)
      doc.text(lines, MARGIN, y + 3)
      y += lines.length * 4.6 + 3
    }
    y += 2
  }

  function table<Row>(columns: Column<Row>[], rows: Row[]) {
    const rowHeight = 8
    const header = () => {
      fill(SURFACE)
      doc.rect(MARGIN, y, contentWidth, rowHeight, "F")
      font(7.5, "bold")
      ink(MUTED)
      let x = MARGIN
      for (const column of columns) {
        const label = fit(column.header.toUpperCase(), column.width - 4)
        if (column.align === "right") doc.text(label, x + column.width - 2, y + 5.2, { align: "right" })
        else doc.text(label, x + 2, y + 5.2)
        x += column.width
      }
      y += rowHeight
    }
    header()
    rows.forEach((row) => {
      if (ensureSpace(rowHeight)) header()
      let x = MARGIN
      columns.forEach((column, index) => {
        font(9, index === 0 ? "bold" : "normal")
        ink(index === 0 ? INK : "#334155")
        let textX = x + 2
        let room = column.width - 4
        const chip = column.chip?.(row)
        if (chip) {
          fill(chip)
          doc.roundedRect(textX, y + 2.4, 3.2, 3.2, 0.8, 0.8, "F")
          textX += 5
          room -= 5
        }
        const value = fit(column.value(row), room)
        if (column.align === "right") doc.text(value, x + column.width - 2, y + 5.4, { align: "right" })
        else doc.text(value, textX, y + 5.4)
        x += column.width
      })
      stroke(LINE)
      doc.setLineWidth(0.15)
      doc.line(MARGIN, y + rowHeight, right, y + rowHeight)
      y += rowHeight
    })
  }

  const paletteColor = (index: number) => variant.palette.colors[index % variant.palette.colors.length] || BRAND

  /* ---------- Page 1: summary ---------- */
  drawLogo(MARGIN, MARGIN, 9)
  font(11, "bold")
  ink(INK)
  doc.text("Rapidash", MARGIN + 12, MARGIN + 6)
  font(9)
  ink(MUTED)
  doc.text("Especificación de dashboard", right, MARGIN + 6, { align: "right" })
  y = MARGIN + 30

  font(8, "bold")
  ink(BRAND)
  doc.text("ESPECIFICACIÓN DE DASHBOARD", MARGIN, y)
  y += 10
  font(26, "bold")
  ink(INK)
  const titleLines = wrap(shownTitle, contentWidth, 3)
  doc.text(titleLines, MARGIN, y)
  y += titleLines.length * 10.5

  if (description.trim()) {
    font(11)
    ink(MUTED)
    const lines = wrap(description.trim(), contentWidth, 8)
    doc.text(lines, MARGIN, y + 1)
    y += lines.length * 5.2 + 4
  }

  // Key facts
  y += 4
  const facts: [string, string][] = [
    ["Tipo de layout", variant.layout],
    ["Componentes", String(variant.combinations.length)],
    ["Variables", String(variant.variables.length)],
    ["Paleta", variant.palette.name],
  ]
  const cardGap = 4
  const cardWidth = (contentWidth - cardGap * (facts.length - 1)) / facts.length
  facts.forEach(([label, value], index) => {
    const x = MARGIN + index * (cardWidth + cardGap)
    fill(SURFACE)
    stroke(LINE)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, cardWidth, 22, 2.5, 2.5, "FD")
    font(7.5, "bold")
    ink(MUTED)
    doc.text(fit(label.toUpperCase(), cardWidth - 8), x + 4, y + 7)
    font(13, "bold")
    ink(INK)
    doc.text(fit(value, cardWidth - 8), x + 4, y + 16)
  })
  y += 22 + 6

  // Palette strip
  const strip = variant.palette.colors.length || 1
  variant.palette.colors.forEach((color, index) => {
    fill(color)
    doc.rect(MARGIN + (contentWidth / strip) * index, y, contentWidth / strip, 3, "F")
  })
  y += 14

  // Index: entries now, page numbers once every section has been drawn.
  font(12, "bold")
  ink(INK)
  doc.text("Contenido", MARGIN, y)
  y += 4
  const indexRows = SECTIONS.map((section, index) => {
    const rowY = y + 7 + index * 9
    font(10, "bold")
    ink(BRAND)
    doc.text(String(index + 1).padStart(2, "0"), MARGIN, rowY)
    font(10)
    ink(INK)
    doc.text(section, MARGIN + 9, rowY)
    stroke(LINE)
    doc.setLineWidth(0.15)
    doc.line(MARGIN, rowY + 3, right, rowY + 3)
    return { section, rowY }
  })

  /* ---------- Sections ---------- */
  sectionHeading("Layout", variant.layoutDescription || undefined)
  const diagramArea: Area = { x: MARGIN, y, width: contentWidth, height: FOOTER_TOP - 14 - y }
  const boxes = diagramBoxes(variant.layout, variant.combinations.length, diagramArea)
  boxes.forEach((box) => {
    const color = paletteColor(box.number - 1)
    fill(color)
    doc.roundedRect(box.x, box.y, box.width, box.height, 1.6, 1.6, "F")
    font(box.height > 12 && box.width > 14 ? 11 : 8, "bold")
    ink(readableTextColor(color))
    doc.text(String(box.number), box.x + 2.5, box.y + (box.height > 12 ? 6 : 4.5))
  })
  const diagramBottom = boxes.length ? Math.max(...boxes.map((b) => b.y + b.height)) : y
  y = diagramBottom + 6
  font(8.5)
  ink(MUTED)
  doc.text(
    fit(`Grilla de 12 columnas · ${variant.combinations.length} componentes · la tabla de componentes detalla cada número`, contentWidth),
    MARGIN,
    y,
  )

  sectionHeading("Componentes", "Cada número corresponde a una caja del diagrama de layout. El tamaño se expresa en columnas × filas de la grilla.")
  table(
    [
      { header: "#", width: 14, value: (r) => String(r.number), chip: (r) => paletteColor(r.number - 1) },
      { header: "Componente", width: 58, value: (r) => r.name },
      { header: "Gráfico", width: 36, value: (r) => r.chart },
      { header: "Variables", width: 46, value: (r) => r.variables },
      { header: "Tamaño", width: contentWidth - 154, value: (r) => r.size, align: "right" },
    ],
    componentRows(variant),
  )

  sectionHeading("Variables", "Variables configuradas, con su tipo, prioridad y la cantidad de componentes que las usan.")
  table(
    [
      { header: "Variable", width: 70, value: (r) => r.name },
      { header: "Tipo", width: 46, value: (r) => r.type },
      { header: "Prioridad", width: 28, value: (r) => r.priority },
      { header: "Usada en", width: contentWidth - 144, value: (r) => String(r.usedIn), align: "right" },
    ],
    variableRows(variant),
  )

  sectionHeading("Paleta de colores", variant.palette.description || undefined)
  const modes: [string, string[]][] = [["Modo claro", variant.palette.colors]]
  if (variant.palette.darkColors?.length) modes.push(["Modo oscuro", variant.palette.darkColors])
  for (const [mode, colors] of modes) {
    ensureSpace(48)
    font(10, "bold")
    ink(INK)
    doc.text(mode, MARGIN, y + 4)
    y += 8
    const perRow = 5
    const gap = 4
    const swatchWidth = (contentWidth - gap * (perRow - 1)) / perRow
    colors.forEach((color, index) => {
      if (index > 0 && index % perRow === 0) y += 38
      if (index % perRow === 0) ensureSpace(38)
      const x = MARGIN + (index % perRow) * (swatchWidth + gap)
      fill(color)
      doc.roundedRect(x, y, swatchWidth, 18, 2, 2, "F")
      font(8.5, "bold")
      ink(INK)
      doc.text(fit(PALETTE_ROLES[index] ?? `Color ${index + 1}`, swatchWidth), x, y + 23)
      font(8)
      ink(MUTED)
      doc.text(fit(color.toUpperCase(), swatchWidth), x, y + 27.5)
      doc.text(fit(`RGB ${rgb(color).join(", ")}`, swatchWidth), x, y + 31.5)
    })
    y += 42
  }

  /* ---------- Index page numbers and footers, now that the page count is known ---------- */
  doc.setPage(1)
  for (const { section, rowY } of indexRows) {
    font(10)
    ink(MUTED)
    doc.text(String(sectionPages.get(section) ?? ""), right, rowY, { align: "right" })
  }

  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page++) {
    doc.setPage(page)
    stroke(LINE)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, FOOTER_TOP, right, FOOTER_TOP)
    font(8)
    ink(MUTED)
    doc.text(`Generado el ${generatedOn} con Rapidash`, MARGIN, FOOTER_TOP + 5)
    doc.text(`Página ${page} de ${total}`, right, FOOTER_TOP + 5, { align: "right" })
  }

  doc.save(pdfFileName(title))
}
