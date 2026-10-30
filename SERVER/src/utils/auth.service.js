import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

export const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: maxAgeMs,
});

export const genToken = async (user, res) => {
  const payload = { id: user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

  if (res) {
    res.cookie("Oreo", token, getCookieOptions(24 * 60 * 60 * 1000));
  }

  return token;
};

export const genOTPToken = async (user, res) => {
  const payload = { id: user._id, isOtp: true };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" }); // OTP token expires in 10 minutes

  if (res) {
    res.cookie("kitkat", token, getCookieOptions(10 * 60 * 1000));
  }

  return token;
};
