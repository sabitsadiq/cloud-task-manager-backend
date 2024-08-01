import User from "../models/user.js";
import Task from "../models/task.js";
import Notice from "../models/notification.js";
export const createTask = async (req, res) => {
  try {
    const { title, team, stage, priority, date, assets } = req.body;
    const { userId } = req.user;

    let text = "Task has been assigned to you.";
    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };
    const task = await Task.create({
      title,
      team,
      stage: stage.toLowerCase(),
      priority: priority.toLowerCase(),
      date,
      assets,
      activities: activity,
    });

    if (team.length > 1) {
      text = text + `and ${task.team.length - 1} others.`;
    }

    text =
      text +
      `The task priority is set a ${
        task.priority
      } priority, so check and act accordingly. The task date is ${new Date.toDateString()}. Thank you !!!`;

    await Notice.create({ team, text, task: task?._id });

    res
      .status(200)
      .json({ status: true, message: "Task created successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    const newTask = await Task.create({
      ...task,
      title: task.title + " -duplicate",
    });
    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.priority = task.priority;
    newTask.stage = task.stage;

    await newTask.save();
    //   Alert user of the new task
    let text = "Task has been assigned to you.";
    if (task.team.length > 1) {
      text = text + `and ${task.team.length - 1} others.`;
    }

    text =
      text +
      `The task priority is set a ${
        task.priority
      } priority, so check and act accordingly. The task date is ${task.date.toDateString()}. Thank you !!!`;

    await Notice.create({ team, text, task: newTask._id });

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;

    const task = await Task.findById(id);

    const data = { type, activity, by: userId };

    task.activity.push(data);
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    const allTasks = isAdmin
      ? await Task.find({ isTrashed: false })
          .populate({ path: "team", select: "name role title email" })
          .sort({ _id: -1 })
      : await Task.find({ isTrashed: false, team: { $all: [userId] } })
          .populate({ path: "team", select: "name role title email" })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //   Group task by stage and calculate counts
    const groupTask = allTasks?.reduce((result, task) => {
      const stage = task?.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }
      return result;
    }, {});

    console.log("allTask", allTasks);
    //   Group task by priority
    const groupData = Object.entries(
      allTasks
        ?.reduce((result, task) => {
          const { priority } = task;
          result[priority] = (result[priority] || 0) + 1;
          console.log(result);
          return result;
        }, {})
        ?.map(([name, total]) => ({ name, total }))
    );

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTask,
      grapgData: groupData,
    };
    res.status(200).json({ status: true, message: "Successfull", ...summary });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const getTasks = async (req, res) => {
  try {
    const { isTrashed, stage } = req.query;
    let query = { isTrashed: isTrashed ? true : false };

    if (stage) {
      query.stage = stage;
    }

    let queryResult = Task.find(query)
      .populate({
        path: "team",
        select: "name email title",
      })
      .sort({ _id: -1 });
    const tasks = await queryResult;
    res.status(200).json({ status: true, tasks });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title email role",
      })
      .populate({ path: "activities.by", select: "name" })
      .sort({ _id: -1 });
    res.status(200).json({ status: true, task });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;
    const newSubTask = { title, tag, date };

    const task = await Task.findById(id);
    task.subTasks.push(newSubTask);
    await task.save();
    res
      .status(200)
      .json({ status: true, message: "Subtask added successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;
    const task = await Task.findById(id);

    task.title = title;
    task.date = date;
    task.priority = priority;
    task.role = role;
    task.assets = assets;
    task.team = team;
    task.stage = stage;

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task Updated successfully." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    task.isTrashed = true;

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Trask trashed successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);
      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res
      .status(200)
      .json({ status: true, message: "Operation performed successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};
