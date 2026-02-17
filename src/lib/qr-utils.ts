import QRCode from "qrcode";

export async function generateQRCode(sku: string): Promise<string> {
    try {
        const dataUri = await QRCode.toDataURL(sku, {
            width: 200,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
            errorCorrectionLevel: "M",
        });
        return dataUri;
    } catch (error) {
        console.error("QR Code generation failed:", error);
        throw new Error("Failed to generate QR code");
    }
}

export async function generateQRCodeSVG(sku: string): Promise<string> {
    try {
        const svg = await QRCode.toString(sku, {
            type: "svg",
            width: 200,
            margin: 1,
            errorCorrectionLevel: "M",
        });
        return svg;
    } catch (error) {
        console.error("QR Code SVG generation failed:", error);
        throw new Error("Failed to generate QR code SVG");
    }
}
