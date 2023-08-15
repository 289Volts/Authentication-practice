import { serialize } from "cookie";
import { sign, verify } from "jsonwebtoken";
import UserModel from "../models/UserModel";
import { connectDb } from "./connect";

export const connectToDb = async () => {
	try {
		await connectDb();
	} catch (err) {
		console.log(err.message);
		return res.status(500).json({ message: "Something went wrong! Couldn't connect to database" });
	}
};

export const serializedCookies = (cookies) =>
	cookies.map(({ name, age, value }) =>
		serialize(name, value, {
			httpOnly: true,
			secure: process.env.NODE_ENV !== "development",
			sameSite: "none",
			path: "/",
			maxAge: name === "accessToken" ? age : 365 * 24 * 60 * 60,
		})
	);

export const signToken = (id, role, secret, expiresIn) => {
	return sign(
		{
            id,
            role
		},
		secret,
		{
			expiresIn,
		}
	);
};

export const decodeToken = (token, secret) => {
	return verify(token, secret);
};

export const verifyToken = async (res, accessToken, refreshToken) => {
	if (!accessToken) return false;

	try {
		verify(accessToken, process.env.JWT_SECRET);
		return true;
	} catch (error) {
		if ((error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") && refreshToken) {
			try {
                const decoded = decodeToken(refreshToken, process.env.JWT_REFRESH_SECRET);
                console.log(decoded);
				const user = await UserModel.findOne({ _id: decoded.id }).select("+refreshToken");
				if (!user) return res.status(401).json({ message: "You are unauthenticated" });
				console.log("no user");
				if (user.refreshToken !== refreshToken) return res.status(401).json({ message: "You are unauthenticated" });
				if (user.deleted) return res.status(401).json({ message: "You are unauthenticated" });
				if (user.suspended) return res.status(401).json({ message: "You are unauthenticated" });

				const newAccessToken = signToken({id:user._id, role: user.role}, process.env.JWT_SECRET, "15m");
				const newRefreshToken = signToken({id:user._id, role: user.role}, process.env.JWT_REFRESH_SECRET, "365d");
				await UserModel.findByIdAndUpdate(user._id, { newRefreshToken });
				const cookies = serializedCookies([
					{ name: "accessToken", value: newAccessToken, age: 900 },
					{ name: "refreshToken", value: newRefreshToken, age: 900 },
				]);

				res.setHeader("Set-Cookie", cookies);
				return true;
			} catch (error) {
				console.log("error");
				return res.status(401).json({ message: "You are unauthenticated" });
			}
		} else return res.status(401).json({ message: "You are unauthenticated" });
	}
};
