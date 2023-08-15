import { connectDb } from "../../../../lib/connect";
import Task from "../../../../models/TaskModel";

export default async function handler(req, res) {
	await connectDb();
	const { method } = req;

	switch (method) {
		case "GET":
			try {
				const tasks = await Task.find();
				res.status(200).json(tasks);
			} catch (error) {
				res.status(400).json({ success: false, message: error.message });
			}
			break;
		case "POST":
			try {
				Task.create(req.body).then((task) => {
					res.status(200).json(task);
				});
			} catch (error) {
				res.status(400).json({ success: false, message: error.message });
			}
			break;
	}
}
