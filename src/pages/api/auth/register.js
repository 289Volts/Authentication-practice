import { hash } from "bcrypt";
import { connectToDb, serializedCookies, signToken } from "../../../../lib/helpers";
import UserModel from "../../../../models/UserModel";

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

	const existingUser = await UserModel.findOne({ username });
	if (existingUser) {
		return res.status(400).json({ message: "Username already exists" });
	}
	try {
		const hashedPassword = await hash(password, 12);
		const user = await UserModel.create({ username, password: hashedPassword });
		const accessToken = signToken(user._id, user.role, process.env.JWT_SECRET, "15m");
		const refreshToken = signToken(user._id, user.role, process.env.JWT_REFRESH_SECRET, "365d");
		
		await UserModel.findByIdAndUpdate(user._id, { refreshToken });
		const cookies = serializedCookies([
			{ name: "accessToken", value: accessToken, age: 900 },
			{ name: "refreshToken", value: refreshToken, age: 900 },
		]);

		res.setHeader("Set-Cookie", cookies);
		return res.status(201).json({ user, refreshToken, accessToken, message: "Account created successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong! Couldn't register user" });
	}
	// const user = await addUser(username, password, res);
	// return res.status(201).json(user);
}
