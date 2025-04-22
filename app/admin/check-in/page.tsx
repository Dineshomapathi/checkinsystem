import { redirect } from "next/navigation"

export default function CheckInRedirect() {
  redirect("/admin/dashboard?tab=check-in")
}
