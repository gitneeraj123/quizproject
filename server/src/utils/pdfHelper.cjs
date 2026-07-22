const pdfLib = require('pdf-parse');

module.exports = async function extractTextFromPDF(buffer) {
    // 1. If it happens to be the old version, run it normally
    if (typeof pdfLib === 'function') {
        const data = await pdfLib(buffer);
        return data.text;
    }

    // 2. THE FIX: Handle the brand-new pdf-parse v2+ API
    if (pdfLib && pdfLib.PDFParse) {
        try {
            // Initialize the new PDFParse class with the buffer
            const parser = new pdfLib.PDFParse(buffer);
            const result = await parser.getText();
            
            // Clean up memory
            if (typeof parser.destroy === 'function') await parser.destroy();
            
            return result.text || result;
        } catch (error) {
            // Fallback config format just in case
            const fallbackParser = new pdfLib.PDFParse({ data: buffer });
            const fallbackResult = await fallbackParser.getText();
            return fallbackResult.text || fallbackResult;
        }
    }

    throw new Error("Unrecognized pdf-parse library structure.");
};