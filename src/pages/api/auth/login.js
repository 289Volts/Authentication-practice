import { compare } from "bcrypt";
import UserModel from "../../../../models/UserModel";
import { connectToDb, serializedCookies, signToken } from "../../../../lib/helpers";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({
			message: "You can't perform this operation!",
		});
	}
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({
			message: "Please provide all required fields!",
		});
	}

	await connectToDb();

	const user = await UserModel.findOne({ username }).select("+password").lean();
	if (!user) return res.status(404).json({ message: "User not found!" });
	const correctPwd = await compare(password, user.password);
	if (!correctPwd) return res.status(401).json({ message: "Username or password incorrect" });
	if (user.deleted) return res.status(401).json({ message: "Your account has been deleted" });
	if (user.suspended) return res.status(401).json({ message: "You are unauthenticated" });

	const hidePasswordFixes = {
		// Make password field undefined. NB: Password field might be removed from the user object
		// user.password = undefined;
		// Create a new user object without the password field. NB: Not feasible as you might need to manually add to the user object every time there is an addition
		// const newUser = {
		// 	username: user.username,
		// 	_id: user._id,
		// 	role: user.role,
		// };
	};

	// Create a new user object from existing user and return the new object without the password field. NB: This is the best approach at this time
	const modifiedUser = (({ password, ...rest }) => rest)(user);

	try {
		const accessToken = signToken(modifiedUser._id, modifiedUser.role, process.env.JWT_SECRET, "15m");
		const refreshToken = signToken(modifiedUser._id, modifiedUser.role, process.env.JWT_REFRESH_SECRET, "365d");
		
		await UserModel.findByIdAndUpdate(modifiedUser._id, { refreshToken });
		const cookies = serializedCookies([
			{ name: "accessToken", value: accessToken, age: 900 },
			{ name: "refreshToken", value: refreshToken, age: 900 },
		]);

		res.setHeader("Set-Cookie", cookies);
		return res.status(200).json({ modifiedUser, accessToken, refreshToken });
	} catch (error) {
		return res.status(401).json({ message: "Username or password incorrect" });
	}
}
