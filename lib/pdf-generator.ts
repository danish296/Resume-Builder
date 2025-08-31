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
 * Alternative method using print CSS for better formatting
 */
export async function generatePdfWithPrintCSS(
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  try {
    const { element, filename = 'resume.pdf' } = options

    // Create a new window with print-optimized styles
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Could not open print window')
    }

    // Get all stylesheets from the current document
    const stylesheets = Array.from(document.styleSheets)
    let allCSS = ''
    
    try {
      stylesheets.forEach(stylesheet => {
        try {
          const rules = stylesheet.cssRules || stylesheet.rules
          if (rules) {
            Array.from(rules).forEach(rule => {
              allCSS += rule.cssText + '\n'
            })
          }
        } catch (e) {
          // Cross-origin stylesheet, skip
        }
      })
    } catch (e) {
      console.warn('Could not extract all CSS rules')
    }

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume PDF</title>
        <style>
          ${allCSS}
          
          /* Print-specific styles */
          @media print {
            body { 
              margin: 0; 
              padding: 20px;
              background: white !important;
              color: black !important;
            }
            * { 
              color: black !important;
              background: transparent !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
          
          /* Ensure good formatting */
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: black;
            background: white;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setTimeout(() => printWindow.close(), 1000)
    }, 500)

    return { success: true, filename }
  } catch (error) {
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

/**
 * Enhanced PDF generation with better CSS handling
 */
export async function generatePdfWithCSS(
  options: PdfGenerationOptions & { 
    includeCSS?: boolean 
    printOptimized?: boolean 
  }
): Promise<PdfGenerationResult> {
  const { element, includeCSS = true, printOptimized = false } = options

  if (printOptimized) {
    return generatePdfWithPrintCSS(options)
  }

  // Use the main function but with better CSS preservation
  return generateAndDownloadPdf(options)
}