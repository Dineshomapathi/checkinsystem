import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface CheckInResultProps {
  result: {
    success: boolean
    message: string
    registration?: {
      full_name: string
      company?: string
      table_number?: string
    }
  }
}

export function CheckInResult({ result }: CheckInResultProps) {
  const { success, message, registration } = result

  const isAlreadyCheckedIn = !success && message.includes("Already checked in")

  return (
    <Card
      className={`
      ${success ? "border-green-500 bg-green-50" : ""}
      ${isAlreadyCheckedIn ? "border-amber-500 bg-amber-50" : ""}
      ${!success && !isAlreadyCheckedIn ? "border-red-500 bg-red-50" : ""}
    `}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {success && <CheckCircle className="h-5 w-5 text-green-500" />}
          {isAlreadyCheckedIn && <AlertCircle className="h-5 w-5 text-amber-500" />}
          {!success && !isAlreadyCheckedIn && <XCircle className="h-5 w-5 text-red-500" />}

          {success && "Check-in Successful"}
          {isAlreadyCheckedIn && "Already Checked In"}
          {!success && !isAlreadyCheckedIn && "Check-in Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registration ? (
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Name:</span> {registration.full_name}
            </p>
            {registration.company && (
              <p>
                <span className="font-semibold">Company:</span> {registration.company}
              </p>
            )}
            {registration.table_number && (
              <p>
                <span className="font-semibold">Table:</span> {registration.table_number}
              </p>
            )}
          </div>
        ) : (
          <p>{message}</p>
        )}
      </CardContent>
    </Card>
  )
}
