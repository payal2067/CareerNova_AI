import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parseResume from "../src/utils/parseResume.js";
import matchJD from "../src/utils/matchJD.js";

describe("Resume Processing & JD Matching Logic", () => {
  it("should reject unsupported file types with a clear error", async () => {
    const invalidFile = {
      mimetype: "image/png",
      buffer: Buffer.from("fake-image-bytes"),
    };

    await assert.rejects(
      async () => {
        await parseResume(invalidFile);
      },
      /Only PDF and DOCX files are supported/i
    );
  });

  it("should reject files with spoofed MIME type lacking valid magic bytes", async () => {
    const spoofedFile = {
      mimetype: "application/pdf",
      buffer: Buffer.from("MZ\x90\x00malicious-executable-header"),
    };

    await assert.rejects(
      async () => {
        await parseResume(spoofedFile);
      },
      /Invalid file signature/i
    );
  });

  it("should match skills against job description and compute structured scores", async () => {
    const sampleResume = {
      name: "Alex Doe",
      email: "alex@example.com",
      skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      experience: [
        {
          title: "Full Stack Engineer",
          company: "Tech Solutions",
          description: "Built scalable web apps using React and Node.js",
        },
      ],
    };

    const targetJobDescription = `
      We are looking for a Senior Full Stack Engineer.
      Required Skills:
      - React
      - Node.js
      - MongoDB
      - TypeScript
      - Docker
      Responsibilities include maintaining microservices and modern frontend interfaces.
    `;

    const matchResult = await matchJD(sampleResume, targetJobDescription);

    assert.ok(matchResult, "Match result object must be returned");
    assert.ok(typeof matchResult.match_score === "number");
    assert.ok(matchResult.match_score >= 0 && matchResult.match_score <= 100);
    assert.ok(Array.isArray(matchResult.matched_keywords));
    assert.ok(Array.isArray(matchResult.missing_keywords));
    assert.ok(Array.isArray(matchResult.actionable_suggestions));

    // Check that overlapping keywords were detected
    const matchedLower = matchResult.matched_keywords.map((k) => k.toLowerCase());
    assert.ok(
      matchedLower.includes("react") || matchedLower.includes("node"),
      "Should identify core matching skills"
    );
  });
});

