/**
 * WhatsApp notification utility
 * Currently a mock — replace with WAHA or WA Business API integration.
 */

export async function sendWA(phone: string, message: string): Promise<boolean> {
    // Normalize phone number to 628... format
    let normalizedPhone = phone.replace(/[^0-9]/g, "");
    if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "62" + normalizedPhone.slice(1);
    }

    console.log(`[WA MOCK] Sending to ${normalizedPhone}:`);
    console.log(`[WA MOCK] ${message}`);

    // TODO: Replace with actual WA API call:
    // const res = await fetch(`${WAHA_URL}/api/sendText`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     chatId: `${normalizedPhone}@c.us`,
    //     text: message,
    //     session: "default",
    //   }),
    // });
    // return res.ok;

    return true;
}

export function buildLoanReminderMessage(
    borrowerName: string,
    productName: string,
    qty: number,
    dueDate: Date,
    transactionCode: string
): string {
    const formattedDate = dueDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return [
        `⚠️ *Pengingat Peminjaman Barang*`,
        ``,
        `Halo *${borrowerName}*,`,
        ``,
        `Kami ingin mengingatkan bahwa peminjaman barang berikut sudah melewati batas waktu:`,
        ``,
        `📦 Barang: *${productName}*`,
        `🔢 Jumlah: *${qty}*`,
        `📅 Jatuh Tempo: *${formattedDate}*`,
        `🔖 Kode: *${transactionCode}*`,
        ``,
        `Mohon segera mengembalikan barang tersebut.`,
        `Terima kasih.`,
        ``,
        `— _AA Rasa Stock System_`,
    ].join("\n");
}
