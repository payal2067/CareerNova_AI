import jwt from "jsonwebtoken";

export const genToken = async (user, res) => {
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    if (res) {
        res.cookie("Oreo", token, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: "lax",
        });
    }

    return token;
};

export const genOTPToken = async (user, res) => {
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" }); // OTP token expires in 10 minutes

    if (res) {
        res.cookie("kitkat", token, {
            httpOnly: true,
            secure: false,
            maxAge: 10 * 60 * 1000,
            sameSite: "lax",
        });
    }

    return token;
};
