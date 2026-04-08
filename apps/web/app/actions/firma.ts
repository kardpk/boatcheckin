"use server";

export async function createSignatureRequest(
  bookingId: string,
  passengerId: string,
  passengerDetails: { firstName: string; lastName: string; email: string }
) {
  try {
    const apiKey = process.env.FIRMA_API_KEY;
    const templateId = process.env.FIRMA_WAIVER_TEMPLATE_ID;

    if (!apiKey || !templateId) {
      console.error("[Firma Action Error] Missing FIRMA_API_KEY or FIRMA_WAIVER_TEMPLATE_ID");
      return { success: false, error: "System configuration error. Please contact support." };
    }

    const payload = {
      name: `Safety Waiver - ${passengerDetails.firstName} ${passengerDetails.lastName}`,
      template_id: templateId,
      recipients: [
        {
          first_name: passengerDetails.firstName,
          last_name: passengerDetails.lastName,
          email: passengerDetails.email,
          designation: "Signer",
          order: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        passenger_id: passengerId,
      },
    };

    const response = await fetch(
      "https://api.firma.dev/functions/v1/signing-request-api/signing-requests",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Firma API Error]", response.status, errText);
      return { success: false, error: "Failed to generate signing request from partner." };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("[Firma Unexpected Request Error]", error);
    return { success: false, error: "An unexpected error occurred while generating waiver." };
  }
}
