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
  console.log('Starting PDF generation...', options)
  
  try {
    const {
      element,
      filename = 'resume.pdf',
      quality = 1,
      scale = 2
    } = options

    console.log('PDF generation options:', { filename, quality, scale })
    console.log('Target element:', element)

    if (!element) {
      throw new Error('No element provided for PDF generation')
    }

    // Check if element is visible and has content
    const rect = element.getBoundingClientRect()
    console.log('Element dimensions:', rect)
    
    if (rect.width === 0 || rect.height === 0) {
      throw new Error('Element has no visible content')
    }

    console.log('Calling html2canvas...')
    
    // Clone the element to preserve all styling and content
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Create a container div with proper positioning
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${element.offsetWidth}px;
      min-height: ${element.offsetHeight}px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    `
    
    container.appendChild(clonedElement)
    
    // Add to document temporarily for rendering
    document.body.appendChild(container)
    
    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    let canvas: HTMLCanvasElement
    try {
      canvas = await html2canvas(clonedElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: scale,
        backgroundColor: '#ffffff',
        removeContainer: false,
        foreignObjectRendering: true,
        // Improved text rendering
        letterRendering: true,
        // Better handling of CSS
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT'
        }
      })
      
      // Clean up temporary element
      document.body.removeChild(container)
    } catch (error) {
      // Clean up on error
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      throw error
    }

    console.log('html2canvas completed. Canvas dimensions:', canvas.width, 'x', canvas.height)

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to generate canvas from element')
    }

    // Calculate dimensions for A4 page with better proportions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    console.log('PDF dimensions calculated:', { imgWidth, imgHeight, pageHeight })

    // Create PDF document
    console.log('Creating PDF document...')
    const pdf = new jsPDF('portrait', 'mm', 'a4')

    // Add first page with better quality
    const imgData = canvas.toDataURL('image/png', quality)
    console.log('Generated image data, length:', imgData.length)
    
    pdf.addImage(
      imgData,
      'PNG',
      0,
      0,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    )
    heightLeft -= pageHeight

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      const position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        imgData,
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

    console.log('PDF created successfully, triggering download...')

    // Trigger download
    pdf.save(filename)

    console.log('PDF download completed successfully')

    return {
      success: true,
      filename
    }
  } catch (error) {
    console.error('PDF generation failed with error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
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