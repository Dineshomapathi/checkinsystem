import { NextResponse } from "next/server"
import { getRegistrationById } from "@/lib/db"
import { generateQRCodeDataURL } from "@/lib/qr-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }

    const registration = await getRegistrationById(id)

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    // Generate QR code data URL
    const qrCodeDataUrl = await generateQRCodeDataURL(registration.qr_code)

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        full_name: registration.full_name,
        email: registration.email,
        table_number: registration.table_number,
      },
      qrCodeDataUrl,
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ success: false, message: "Failed to generate QR code" }, { status: 500 })
  }
}
