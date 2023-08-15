import { connectDb } from "../../../../../lib/connect";
import { decodeToken, verifyToken } from "../../../../../lib/helpers";
import UserModel from "../../../../../models/UserModel";

export default async function handler(req, res) {
	if (req.method !== "PATCH") return res.status(405).json({ message: "You can't perform this operation!" });

	const { slug } = req.query;

	if (!slug) {
		return res.status(400).json({
			message: "Please provide all required fields!",
		});
	}
	await connectDb();
	const { accessToken, refreshToken } = req.cookies;

	const verify = await verifyToken(res, accessToken, refreshToken);
	if (verify) {
		try {
			const decoded = decodeToken(refreshToken, process.env.JWT_REFRESH_SECRET);
			console.log(decoded);
			if (decoded.id !== slug) return res.status(401).json({ message: "You cannot delete user" });

			await UserModel.findByIdAndUpdate(slug, { deleted: true });
			return res.status(200).json({ message: "Account deleted" });
		} catch (err) {
			return res.status(401).json({ message: "You are unauthenticated" });
		}
	} else {
		return res.status(401).json({ message: "You are unauthenticated" });
	}
}
