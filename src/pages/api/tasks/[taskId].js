import { connectDb } from "../../../../lib/connect";
import Task from "../../../../models/TaskModel";

export default async function handler(req, res) {
	await connectDb();
    const { method } = req;
    const { taskId } = req.query;

	switch (method) {
		case "PUT":
            try {
                if ((!req.body.task) || (req.body.task === "")) {
                    res.status(400).json({ success: false, message: "Task is required" });
                } 
				await Task.updateOne({ _id: taskId }, req.body);
				res.status(200).json({success: true, message: "Task updated"});
			} catch (error) {
				res.status(400).json({ success: false, message: error.message });
			}
			break;
		case "DELETE":
			try {
			await	Task.deleteOne({ _id: taskId })
					res.status(200).json({success: true, message: "Task deleted"});
			} catch (error) {
				res.status(400).json({ success: false, message: error.message });
			}
			break;
	}
}
