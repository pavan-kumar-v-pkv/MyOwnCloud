/*
backend/ai/analyzeFiles.js

Functions:
- detectFileType(filePath)
- extractText(filePath, mimetype) // uses pdf-parse for PDFs, tesseract for images
- getEmbedding(text)               // uses groq AI to get text embeddings
- generateTagsAndCategory(text)    // uses groq AI to generate tags and categories

Export: analyzeFile(fileRecord) which runs the pipeline and returns the final updated object result.
*/
const fs = require('fs');
const path = require('path');
const FileType = require('file-type');
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const OpenAI = require("openai");

// load .env 
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// Detect file type by content - FIXED for file-type v16
async function detectFileType(filePath) { 
    try {
        const buffer = await fs.promises.readFile(filePath); // Read file content
        const ft = await FileType.fromBuffer(buffer); // Detect file type using v16 syntax
        if (ft) return ft.mime; // Return MIME type if detected
    } catch (error) {
        console.log('File type detection failed, using fallback:', error.message);
    }
    
    // Fallback: use extension
    const ext = path.extname(filePath).toLowerCase(); // Get file extension
    if (ext === '.pdf') return 'application/pdf'; // PDF
    if (ext.match(/\.(jpe?g|png|gif|bmp|webp)$/)) return "image/*";
    return 'application/octet-stream'; // Default
}

// Extract text for PDFs and images. For others return empty string.
async function extractText(filePath, mimetype) {
    try {
        const buffer = await fs.promises.readFile(filePath); // Read file content

        if(mimetype === 'application/pdf'){
            // pdf-parse returns text
            const data = await pdfParse(buffer);
            return data.text || ""; // Return extracted text or empty string
        }

        if(mimetype.startsWith("image/") || mimetype === "image/*"){
            // Tesseract OCR - may be slow; considering background job
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { logger: info => console.log(info) });
            return text || ""; // Return extracted text or empty string
        }

        // For text-like mimetypes we can return buffer
        if(mimetype.startsWith("text/")){
            return buffer.toString("utf-8");
        }

        return "";
    } catch (err) {
        console.error("Error extracting text:", err);
        return ""; // Return empty string on error
    }
}

// Call OpenAI embeddings API - DISABLED because Groq doesn't support embeddings
async function getEmbedding(text) {
    if (!text || text.trim().length === 0) {
        return null; // Return null if text is empty
    }

    // Groq doesn't support embedding models, so we'll skip this for now
    // In a production app, you'd use a service like OpenAI, Hugging Face, or local embeddings
    console.log("Embedding generation skipped - Groq doesn't support embedding models");
    return null; // Return null to skip embeddings
    
    // COMMENTED OUT - Original OpenAI embedding code
    // const chunk = text.length > 30000 ? text.slice(0, 30000) : text;
    // const resp = await openai.embeddings.create({
    //     model: "text-embedding-ada-002",
    //     input: chunk,
    // });
    // const embedding = resp.data[0].embedding;
    // return embedding;
}

// Ask OpenAI to return tags and a category in JSON so we can parse it reliably
async function generateTagsAndCategory(text) {
    if(!text || text.trim().length === 0) {
        return { tags: [], category: "unknown" };
    }

    // Prompt: ask for upto 6 short tags and a category
    const prompt = `You are a smart file classifier. Given the following extracted text from a file, return a JSON object with:
    - "category": a single word category such as "Resume", "Invoice", "Notes", "Report", "Code" or "Other".
    - "tags": an array of short tags (2-6 tags) that summarize the content (e.g. ["resume", "machine learning", "internship"]).
    Return only valid JSON.

    TEXT:
    """
    ${text.slice(0, 2000)}
    """
    `;

    // Try different Groq model names until we find one that works
    const models = [
        "llama3-70b-8192",
        "llama-3.1-70b-versatile", 
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma-7b-it"
    ];

    for (const model of models) {
        try {
            console.log(`Trying model: ${model}`);
            const completion = await openai.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.0,
            });

            const message = completion.choices[0].message.content;
            console.log(`Successfully used model: ${model}`);

            // try parse JSON, otherwise fallback
            try {
                // sanitize: find first { ... } block
                const jsonStart = message.indexOf("{");
                const jsonEnd = message.lastIndexOf("}");
                const jsonText = jsonStart >= 0 && jsonEnd >= 0 ? message.slice(jsonStart, jsonEnd + 1) : null;
                if (jsonText) {
                    const obj = JSON.parse(jsonText);
                    // Extract tags and category
                    const tags = Array.isArray(obj.tags) ? obj.tags.map(t => String(t)) : [];
                    const category = obj.category ? String(obj.category) : "Other";
                    return { tags, category };
                }
            } catch (err) {
                console.warn("Could not parse JSON from AI response, trying next model", err);
                continue; // Try next model
            }
            
            // If we get here, the model worked but JSON parsing failed
            break;
            
        } catch (err) {
            console.warn(`Model ${model} failed:`, err.message);
            continue; // Try next model
        }
    }

    // fallback: naive tag extraction
    console.log("All models failed, using fallback categorization");
    return { tags: [], category: "Other" };
}

// Full analyze pipeline
async function analyzeFile(dbFileRecord){
    // dbFileRecord should contain at least: { id, filepath, mimetype }
    const filePath = dbFileRecord.filepath;
    const mimetypeDetected = await detectFileType(filePath);
    const text = await extractText(filePath, dbFileRecord.mimetype || mimetypeDetected);
    const embedding = await getEmbedding(text);
    const { tags, category } = await generateTagsAndCategory(text);

    // return object to be saved in the database
    return {
        textExtract: text,
        tags, 
        category,
        embedding,
    };
}

module.exports = {
    analyzeFile,
    detectFileType,
    extractText,
    getEmbedding,
    generateTagsAndCategory,
};
