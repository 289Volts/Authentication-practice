import { Schema, model, models } from "mongoose";
// import { hash } from "bcrypt";

const UserSchema = new Schema({
	username: { type: String, required: [true, "Please provide a username!"], unique: true },
	password: { type: String, required: [true, "Please provide a password!"], select: false },
	role: { type: String, enum: ["staff", "hr", "dev", "manager"], default: "staff" },
	deleted: { type: Boolean, default: false },
	suspended: { type: Boolean, default: false },
	refreshToken: { type: String, select: false },
});

UserSchema.pre("/^find/", async function (next) {
	this.find({ deleted: { $ne: true } });
	next();
});

export default models.User || model("User", UserSchema);
