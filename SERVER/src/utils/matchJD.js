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
        temperature: 0,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini API failed");
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const normalizeKeywords = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
};

const matchJD = async (resumeObj, jobDescription) => {
  const resumeSkills = (resumeObj?.skills || []).map((skill) =>
    String(skill).toLowerCase()
  );

  const jdWords = normalizeKeywords(jobDescription);
  const stopWords = new Set([
    "with", "from", "this", "that", "role", "team", "work", "about",
    "skills", "experience", "job", "description", "responsibilities",
    "must", "will", "looking", "strong", "good", "your", "and", "the",
    "for", "you", "are", "have", "been", "our", "all", "more"
  ]);

  const uniqueJdKeywords = [...new Set(jdWords.filter((word) => !stopWords.has(word)))];

  const matchedSkills = uniqueJdKeywords.filter((keyword) => {
    return resumeSkills.some(
      (skill) => skill.includes(keyword) || keyword.includes(skill)
    );
  });

  const missingSkills = uniqueJdKeywords.filter((keyword) => {
    return !resumeSkills.some(
      (skill) => skill.includes(keyword) || keyword.includes(skill)
    );
  });

  const prompt = `
    Compare the resume against the job description.
    Return valid JSON only in this exact format:
    {
      "match_score": 0,
      "job_suitability": "",
      "summary": "",
      "matched_keywords": [],
      "missing_keywords": [],
      "actionable_suggestions": []
    }

    Resume:
    ${JSON.stringify(resumeObj, null, 2)}

    Job Description:
    ${jobDescription}
  `;

  let aiOutput = null;
  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      aiOutput = await callGemini(prompt);
    } catch (error) {
      console.warn("⚠️ Gemini JD Match API Warning:", error.message);
    }
  }

  if (!aiOutput) {
    const totalKeywords = matchedSkills.length + missingSkills.length;
    const computedScore = totalKeywords > 0
      ? Math.min(95, Math.max(30, Math.round((matchedSkills.length / totalKeywords) * 100)))
      : 65;

    let suitability = "Moderate Match";
    if (computedScore >= 75) suitability = "Strong Fit";
    else if (computedScore < 50) suitability = "Needs Tailoring";

    return {
      match_score: computedScore,
      job_suitability: suitability,
      summary: `Your profile matches ${matchedSkills.length} key requirement(s) from this job description. Adding relevant keywords from the missing skills list can boost your ATS match score.`,
      matched_keywords: matchedSkills.slice(0, 15),
      missing_keywords: missingSkills.slice(0, 15),
      actionable_suggestions: [
        "Incorporate missing core skills and technologies explicitly in your projects and work history.",
        "Quantify your accomplishments with measurable metrics (e.g., percentages, scale, throughput).",
        "Align your resume summary with the primary responsibilities highlighted in the job description."
      ],
    };
  }

  // Clean Markdown JSON code fences if present
  const cleanOutput = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();

  let parsedResult = {
    match_score: 0,
    job_suitability: "Unknown",
    summary: "",
    matched_keywords: matchedSkills.slice(0, 15),
    missing_keywords: missingSkills.slice(0, 15),
    actionable_suggestions: [],
  };

  try {
    parsedResult = JSON.parse(cleanOutput);
  } catch {
    parsedResult.summary = aiOutput;
  }

  // Ensure missing & matched keywords fallback is used if empty
  parsedResult.missing_keywords =
    parsedResult.missing_keywords?.length > 0
      ? parsedResult.missing_keywords
      : missingSkills.slice(0, 15);

  parsedResult.matched_keywords =
    parsedResult.matched_keywords?.length > 0
      ? parsedResult.matched_keywords
      : matchedSkills.slice(0, 15);

  return parsedResult;
};

export default matchJD;
