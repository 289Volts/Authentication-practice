import mongoose from "mongoose";

export const connectDb = async () => {
	if (mongoose.connection.readyState === 1) {
		console.log("Already connected.");
		return mongoose.connection.asPromise();
	}

	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
	}
};
