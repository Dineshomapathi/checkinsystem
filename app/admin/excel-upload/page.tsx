import { Suspense } from "react"
import { AdminLayout } from "@/components/admin-layout"
import ExcelUploadContent from "./excel-upload-content"

export default function ExcelUploadPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ExcelUploadContent />
      </Suspense>
    </AdminLayout>
  )
}
