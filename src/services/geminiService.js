export const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  'zh-CN': 'Chinese (Simplified)',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  tr: 'Turkish',
  vi: 'Vietnamese',
  auto: 'Auto Detect'
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const errorText = await response.text();
        throw new Error(`Client error (${response.status}): ${errorText}`);
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await wait(delay);
      delay *= 2;
    }
  }
}

export async function translateWithGemini(text, sourceLang, targetLang, apiKey) {
  if (!text || !text.trim()) {
    return { translatedText: '' };
  }

  if (sourceLang === targetLang) {
    return { translatedText: text, detectedLanguage: sourceLang };
  }

  const targetName = LANGUAGE_NAMES[targetLang] || targetLang;
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang;

  const isAuto = sourceLang === 'auto';
  const systemInstructionText = isAuto
    ? `Translate the user text into ${targetName} (${targetLang}). Detect the source language. Output only a JSON object with keys "translatedText" and "detectedLanguage" (ISO code).`
    : `Translate the user text from ${sourceName} (${sourceLang}) into ${targetName} (${targetLang}). Output only a JSON object with key "translatedText".`;

  const responseSchema = isAuto
    ? {
        type: 'OBJECT',
        properties: {
          detectedLanguage: { type: 'STRING' },
          translatedText: { type: 'STRING' }
        },
        required: ['detectedLanguage', 'translatedText']
      }
    : {
        type: 'OBJECT',
        properties: {
          translatedText: { type: 'STRING' }
        },
        required: ['translatedText']
      };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1
    }
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();
  const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Invalid response received from Gemini API');
  }

  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed.translatedText !== 'string') {
    throw new Error('Response does not contain translatedText');
  }

  return {
    translatedText: parsed.translatedText,
    detectedLanguage: parsed.detectedLanguage || undefined
  };
}
