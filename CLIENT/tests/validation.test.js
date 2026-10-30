import { describe, it } from "node:test";
import assert from "node:assert/strict";

const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 6;
};

const validateFileUpload = (file) => {
  if (!file) return { valid: false, error: "File is required" };
  const allowedExtensions = ["pdf", "docx"];
  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: "Unsupported file format. Only PDF and DOCX are supported." };
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return { valid: false, error: "File exceeds 5MB size limit." };
  }
  return { valid: true };
};

describe("Frontend Client Validation Rules", () => {
  it("should validate well-formed email addresses", () => {
    assert.equal(validateEmail("developer@example.com"), true);
    assert.equal(validateEmail("user.name+tag@sub.domain.co"), true);
    assert.equal(validateEmail("invalid-email"), false);
    assert.equal(validateEmail("user@.com"), false);
    assert.equal(validateEmail(""), false);
  });

  it("should enforce minimum password length of 6 characters", () => {
    assert.equal(validatePassword("123456"), true);
    assert.equal(validatePassword("pass@word1"), true);
    assert.equal(validatePassword("12345"), false);
    assert.equal(validatePassword(""), false);
  });

  it("should enforce PDF/DOCX file extension and 5MB size restrictions", () => {
    assert.equal(validateFileUpload({ name: "resume.pdf", size: 1024 * 1024 }).valid, true);
    assert.equal(validateFileUpload({ name: "cv.docx", size: 2 * 1024 * 1024 }).valid, true);

    const badExt = validateFileUpload({ name: "script.exe", size: 1024 });
    assert.equal(badExt.valid, false);
    assert.match(badExt.error, /unsupported/i);

    const oversized = validateFileUpload({ name: "huge.pdf", size: 10 * 1024 * 1024 });
    assert.equal(oversized.valid, false);
    assert.match(oversized.error, /exceeds 5MB/i);
  });
});

