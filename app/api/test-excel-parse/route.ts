import { NextResponse } from "next/server"

// This is a sample Excel data in JSON format that mimics what would be parsed from an Excel file
const sampleExcelData = [
  {
    Company: "ABC Corporation",
    Name: "John Doe",
    Email: "john.doe@example.com",
    Roles: "Developer",
    "Vendor details": "External Contractor",
    Subsidary: "Tech Division",
    Hash: "am9obi5kb2VAZXhhbXBsZS5jb20=", // Base64 encoded email
  },
  {
    Company: "XYZ Inc",
    Name: "Jane Smith",
    Email: "jane.smith@example.com",
    Roles: "Manager",
    "Vendor details": "",
    Subsidary: "HR Department",
    Hash: "amFuZS5zbWl0aEBleGFtcGxlLmNvbQ==", // Base64 encoded email
  },
  {
    Company: "123 Systems",
    Name: "Bob Johnson",
    Email: "bob.johnson@example.com",
    Roles: "Analyst",
    "Vendor details": "Internal",
    Subsidary: "Finance",
    Hash: "Ym9iLmpvaG5zb25AZXhhbXBsZS5jb20=", // Base64 encoded email
  },
  {
    Company: "",
    Name: "Alice Williams",
    Email: "alice.williams@example.com",
    Roles: "",
    "Vendor details": "",
    Subsidary: "",
    Hash: "YWxpY2Uud2lsbGlhbXNAZXhhbXBsZS5jb20=", // Base64 encoded email
  },
  {
    Company: "Global Tech",
    Name: "Charlie Brown",
    Email: "charlie.brown@example.com",
    Roles: "Executive",
    "Vendor details": "VIP",
    Subsidary: "Board",
    Hash: "Y2hhcmxpZS5icm93bkBleGFtcGxlLmNvbQ==", // Base64 encoded email
  },
]

export async function GET() {
  try {
    // Convert the sample data to what would be returned by parseExcelFile
    const parsedData = sampleExcelData
      .map((row) => ({
        company: row["Company"] || "",
        name: row["Name"] || "",
        email: row["Email"] || "",
        roles: row["Roles"] || "",
        vendor_details: row["Vendor details"] || "",
        subsidiary: row["Subsidary"] || "",
        hash: row["Hash"] || "",
      }))
      .filter((reg) => reg.name && reg.email && reg.hash)

    return NextResponse.json({
      success: true,
      message: "Sample Excel data parsed successfully",
      data: parsedData,
      rowCount: parsedData.length,
    })
  } catch (error) {
    console.error("Error in test parse:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error parsing sample data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
