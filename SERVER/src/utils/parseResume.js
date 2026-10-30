import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Import directly from lib/pdf-parse.js to avoid debug test execution in index.js under ESM
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import mammoth from "mammoth";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini API failed");
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
  "React", "React.js", "React Native", "Angular", "Vue", "Vue.js", "Next.js", "Node.js", "Express", "Express.js",
  "HTML", "HTML5", "CSS", "CSS3", "Tailwind CSS", "Bootstrap", "Sass", "Redux", "GraphQL", "REST API", "RESTful APIs",
  "MongoDB", "SQL", "MySQL", "PostgreSQL", "SQLite", "Redis", "Oracle", "Firebase",
  "AWS", "Amazon Web Services", "Azure", "Google Cloud", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "GitHub", "GitLab",
  "Linux", "Unit Testing", "Jest", "Mocha", "Cypress", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
  "NLP", "Data Analysis", "Pandas", "NumPy", "Scikit-Learn", "Agile", "Scrum", "Jira"
];

// Fallback rule-based extractor when Gemini is unavailable or not configured
const extractResumeDetailsFallback = (rawText) => {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Extract Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract Phone
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Extract Candidate Name from first few lines (excluding headers/emails)
  let name = "";
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 50 &&
      !line.includes("@") &&
      !line.match(/resume|curriculum|vitae|page|contact|email|phone/i)
    ) {
      name = line.replace(/[^a-zA-Z\s.]/g, "").trim();
      if (name.split(/\s+/).length >= 1 && name.split(/\s+/).length <= 4) {
        break;
      }
    }
  }

  // Extract Skills
  const lowerText = rawText.toLowerCase();
  const detectedSkills = COMMON_SKILLS.filter((skill) => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(lowerText);
  });

  // Extract basic Experience mentions
  const experience = [];
  const expMatch = rawText.match(/(?:experience|employment|work history)([\s\S]*?)(?:education|projects|skills|certifications|$)/i);
  if (expMatch && expMatch[1]) {
    const expLines = expMatch[1].split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 10);
    if (expLines.length > 0) {
      experience.push({
        title: expLines[0].slice(0, 80),
        company: expLines[1] ? expLines[1].slice(0, 80) : "",
        duration: "",
        description: expLines.slice(2, 6).join(" ").slice(0, 300),
      });
    }
  }

  // Extract basic Education mentions
  const education = [];
  const eduMatch = rawText.match(/(?:education|academics|qualifications)([\s\S]*?)(?:experience|projects|skills|certifications|$)/i);
  if (eduMatch && eduMatch[1]) {
    const eduLines = eduMatch[1].split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 5);
    education.push(...eduLines.slice(0, 3));
  }

  // Extract Summary
  const summaryMatch = rawText.match(/(?:summary|objective|about me|profile)([\s\S]*?)(?:experience|education|skills|projects|$)/i);
  const summary = summaryMatch && summaryMatch[1]
    ? summaryMatch[1].replace(/\s+/g, " ").trim().slice(0, 300)
    : lines.slice(0, 4).join(" ").slice(0, 250);

  return {
    name: name || "Candidate",
    email,
    phone,
    summary,
    skills: detectedSkills.length > 0 ? detectedSkills : ["General Software Engineering"],
    experience,
    education,
    projects: [],
  };
};

const parseResume = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided for parsing");
  }

  let text;

  if (file.mimetype === "application/pdf") {
    // Magic-byte signature check for PDF (%PDF -> 0x25, 0x50, 0x44, 0x46)
    if (file.buffer.length < 4 || file.buffer.slice(0, 4).toString() !== "%PDF") {
      throw new Error("Invalid file signature: File claims to be PDF but does not have valid PDF magic bytes");
    }
    const pdfData = await pdfParse(file.buffer);
    text = pdfData.text || "";
  } else if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    // Magic-byte check for DOCX (PK\x03\x04) or legacy DOC (\xD0\xCF\x11\xE0)
    const isDocx = file.buffer.length >= 4 && file.buffer[0] === 0x50 && file.buffer[1] === 0x4B;
    const isDoc = file.buffer.length >= 4 && file.buffer[0] === 0xD0 && file.buffer[1] === 0xCF;
    if (!isDocx && !isDoc) {
      throw new Error("Invalid file signature: File claims to be Word document but does not have valid magic bytes");
    }
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    text = result.value || "";
  } else {
    throw new Error("Only PDF and DOCX files are supported");
  }

  if (!text.trim()) {
    throw new Error("Could not extract any text from the uploaded file.");
  }

  const prompt = `
    Extract resume details into valid JSON only.
    Use this exact structure:
    {
      "name": "",
      "email": "",
      "phone": "",
      "summary": "",
      "skills": [],
      "experience": [
        { "title": "", "company": "", "duration": "", "description": "" }
      ],
      "education": [],
      "projects": []
    }

    Resume text:
    ${text.slice(0, 10000)}
  `;

  // Try AI Extraction first if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const aiOutput = await callGemini(prompt);
      const cleanOutput = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanOutput);
      if (parsed && typeof parsed === "object") {
        return {
          name: parsed.name || "Candidate",
          email: parsed.email || "",
          phone: parsed.phone || "",
          summary: parsed.summary || "",
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        };
      }
    } catch (aiErr) {
      console.warn("⚠️ Gemini resume parsing failed or rate-limited, falling back to local extractor:", aiErr.message);
    }
  }

  // Graceful heuristic fallback if Gemini is not configured or failed
  return extractResumeDetailsFallback(text);
};

export default parseResume;
