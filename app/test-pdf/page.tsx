"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { generateAndDownloadPdf, generatePdfFilename } from "@/lib/pdf-generator"

export default function TestPDFPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const testPDFGeneration = async () => {
    setIsGenerating(true)
    
    try {
      const testElement = document.getElementById('test-resume-content')
      
      if (!testElement) {
        throw new Error('Test element not found')
      }

      toast.loading("Generating test PDF...", { id: "test-pdf" })
      
      const result = await generateAndDownloadPdf({
        element: testElement,
        filename: generatePdfFilename('Test Resume'),
        quality: 0.95,
        scale: 2
      })
      
      if (result.success) {
        toast.success(`Test PDF generated successfully: ${result.filename}`, { id: "test-pdf" })
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('Test PDF generation failed:', error)
      toast.error(`Test failed: ${error instanceof Error ? error.message : String(error)}`, { id: "test-pdf" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">PDF Generation Test</h1>
      
      <div className="mb-6">
        <Button 
          onClick={testPDFGeneration} 
          disabled={isGenerating}
          className="mb-4"
        >
          {isGenerating ? "Generating..." : "Test PDF Generation"}
        </Button>
      </div>

      {/* Test content to convert to PDF */}
      <div 
        id="test-resume-content"
        className="max-w-2xl mx-auto bg-white p-8 border border-gray-200 shadow-lg"
        style={{ width: '794px', minHeight: '400px' }}
      >
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">John Smith</h1>
          <h2 className="text-xl text-gray-700 mb-1">Senior Software Engineer</h2>
          <p className="text-gray-600">john.smith@example.com | (555) 123-4567</p>
        </header>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Professional Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Experienced software engineer with 8+ years of expertise in full-stack development, 
            specializing in React, Node.js, and cloud technologies. Proven track record of 
            leading cross-functional teams and delivering scalable solutions that improve user 
            experience and business outcomes.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Technical Skills
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong>Frontend:</strong> React, TypeScript, Next.js, Vue.js
            </div>
            <div>
              <strong>Backend:</strong> Node.js, Python, Express, FastAPI
            </div>
            <div>
              <strong>Database:</strong> PostgreSQL, MongoDB, Redis
            </div>
            <div>
              <strong>Cloud:</strong> AWS, Docker, Kubernetes, Terraform
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Experience
          </h3>
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">Senior Software Engineer</h4>
                <p className="text-gray-600">Tech Solutions Inc.</p>
              </div>
              <span className="text-sm text-gray-500">2021 - Present</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Led development of microservices architecture serving 1M+ users</li>
              <li>Improved application performance by 40% through optimization</li>
              <li>Mentored junior developers and established coding standards</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Education
          </h3>
          <div>
            <h4 className="font-medium text-gray-900">Bachelor of Science in Computer Science</h4>
            <p className="text-gray-600">University of Technology • 2016</p>
          </div>
        </section>
      </div>
    </main>
  )
}