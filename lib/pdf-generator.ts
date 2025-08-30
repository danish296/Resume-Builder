import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PdfGenerationOptions {
  element: HTMLElement
  filename?: string
  quality?: number
  scale?: number
}

export interface PdfGenerationResult {
  success: boolean
  error?: string
  filename?: string
}

/**
 * Generates and downloads a PDF from an HTML element
 */
export async function generateAndDownloadPdf(
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  try {
    const {
      element,
      filename = 'resume.pdf',
      quality = 1,
      scale = 2
    } = options

    // Generate canvas from HTML element with high quality
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: element.scrollHeight,
      width: element.scrollWidth,
      scrollX: 0,
      scrollY: 0,
    })

    // Calculate dimensions for A4 page
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Create PDF document
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    let position = 0

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png', quality),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    )
    heightLeft -= pageHeight

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        canvas.toDataURL('image/png', quality),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      )
      heightLeft -= pageHeight
    }

    // Trigger download
    pdf.save(filename)

    return {
      success: true,
      filename
    }
  } catch (error) {
    console.error('PDF generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Generates a meaningful filename for the resume PDF
 */
export function generatePdfFilename(resumeName?: string, userName?: string): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const name = resumeName || userName || 'Resume'
  
  // Clean the name to be filename-safe
  const cleanName = name
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
  
  return `${cleanName}_${date}.pdf`
}

/**
 * Fallback to browser print if PDF generation fails
 */
export function fallbackToPrint(printUrl: string): void {
  const win = window.open(printUrl, '_blank', 'noopener,noreferrer')
  if (!win) {
    // Popup blocked: fallback to same tab
    window.location.href = printUrl
  }
}