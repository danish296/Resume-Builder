  "use client"
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Pencil, Trash2, Download, Copy } from "lucide-react"
  import { useRouter } from "next/navigation"
  import type { Resume } from "@/lib/types"
  import { format } from "date-fns"

  type Props = {
    resume: Resume
    onDelete: (id: string) => void
    onDownload: (id: string) => void
    onDuplicate: (id: string) => void
  }

  export function ResumeCard({ resume, onDelete, onDownload, onDuplicate }: Props) {
    const router = useRouter()
    return (
      <Card className="group flex h-full flex-col border-border/80 transition-shadow hover:shadow-sm">
        <CardHeader className="space-y-0">
          <CardTitle className="text-base">{resume.name || "Untitled Resume"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="truncate">{resume.role || "—"}</div>
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated: {format(new Date(resume.updatedAt), "MMM d, yyyy")}</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Duplicate"
              className="hover:text-foreground"
              onClick={() => onDuplicate(resume.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Edit"
              className="hover:text-foreground"
              onClick={() => router.push(`/editor?id=${resume.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Download"
              className="hover:text-foreground"
              onClick={() => onDownload(resume.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete"
              className="text-red-600 hover:text-red-600"
              onClick={() => onDelete(resume.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }
