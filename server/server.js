require("dotenv").config(); //load environment variables


//importing packages!! 
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express(); //expression application here

//connecting to MongoDB
const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    serverSelectionTimeoutMS: 10000
});

//connecting to the database

const database = client.db("loginApp");

const users = database.collection("users");
const projects = database.collection("Projects");
const projectMemberships = database.collection("ProjectMemberships");

// PA4: Collection for storing project user stories
const userStories = database.collection("UserStories");

//middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});


app.get("/users", async (req, res) => {
    try {
        const registeredUsers = await users.find(
            {},
            {
                projection: {
                    password: 0
                }
            }
        ).toArray();

        res.status(200).json(registeredUsers);
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            message: "Could not retrieve users"
        });
    }
});

// Create a new project
app.post("/projects", async (req, res) => {
    try {
        const { name, description, status, project_lead_id } = req.body;

        // Check that all required fields are provided
        if (
            !name?.trim() ||
            !description?.trim() ||
            !status ||
            !project_lead_id
        ) {
            return res.status(400).json({
                message: "All project fields are required"
            });
        }

        // Check that the status is valid
        const validStatuses = ["Planning", "Active", "Completed"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status must be Planning, Active, or Completed"
            });
        }

        // Convert the project lead ID into a MongoDB ObjectId
        const { ObjectId } = require("mongodb");
        let leadId;

        if (!ObjectId.isValid(project_lead_id)) {
            return res.status(400).json({
                message: "Invalid project lead ID"
            });
        }

        leadId = new ObjectId(project_lead_id);

        // Check whether the project lead exists
        const lead = await users.findOne({ _id: leadId });

        if (!lead) {
            return res.status(400).json({
                message: "Selected project lead does not exist"
            });
        }

        // Save the project in MongoDB
        const project = {
            name: name.trim(),
            description: description.trim(),
            status,
            project_lead_id: leadId
        };

        const projectResult = await projects.insertOne(project);

        // Automatically make the project lead a project member
        await projectMemberships.insertOne({
            project_id: projectResult.insertedId,
            user_id: leadId
        });

        res.status(201).json({
            message: "Project created successfully",
            project: {
                _id: projectResult.insertedId,
                ...project,
                project_lead_name: `${lead.f_name} ${lead.l_name}`,
                project_lead_username: lead.username
            }
        });
    } catch (error) {
        console.error("Create project error:", error);

        res.status(500).json({
            message: "Could not create project"
        });
    }
});


// Get all projects and their project lead information
app.get("/projects", async (req, res) => {
    try {
        const allProjects = await projects.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "project_lead_id",
                    foreignField: "_id",
                    as: "projectLead"
                }
            },
            {
                $unwind: "$projectLead"
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    status: 1,
                    project_lead_id: 1,
                    project_lead_name: {
                        $concat: [
                            "$projectLead.f_name",
                            " ",
                            "$projectLead.l_name"
                        ]
                    },
                    project_lead_username: "$projectLead.username"
                }
            }
        ]).toArray();

        res.status(200).json(allProjects);
    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
            message: "Could not retrieve projects"
        });
    }
});


// Get all members of a project
app.get("/projects/:projectId/members", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId } = req.params;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const memberships = await projectMemberships.find({
            project_id: projectObjectId
        }).toArray();

        const memberIds = memberships.map(member => member.user_id);

        const members = await users.find(
            { _id: { $in: memberIds } },
            { projection: { password: 0 } }
        ).toArray();

        res.status(200).json(members);
    } catch (error) {
        console.error("Get project members error:", error);
        res.status(500).json({
            message: "Could not retrieve project members"
        });
    }
});


// Add a registered user to a project
app.post("/projects/:projectId/members", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId } = req.params;
        const { user_id } = req.body;

        if (!ObjectId.isValid(projectId) || !user_id ||
            !ObjectId.isValid(user_id)) {
            return res.status(400).json({
                message: "Valid project ID and user ID are required"
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(user_id);

        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const user = await users.findOne({
            _id: userObjectId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const existingMembership = await projectMemberships.findOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        if (existingMembership) {
            return res.status(409).json({
                message: "This user is already a member of the project"
            });
        }

        await projectMemberships.insertOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        res.status(201).json({
            message: "Member added successfully"
        });
    } catch (error) {
        console.error("Add project member error:", error);
        res.status(500).json({
            message: "Could not add project member"
        });
    }
});


// Remove a member, but never allow removing the project lead
app.delete("/projects/:projectId/members/:userId", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId, userId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid project ID or user ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(userId);

        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (project.project_lead_id.equals(userObjectId)) {
            return res.status(400).json({
                message: "The project lead cannot be removed from the project"
            });
        }

        
        // PA4: Check if this member has assigned user stories
        const assignedStory = await userStories.findOne({
            project_id: projectObjectId,
            assigned_user_id: userObjectId
        });

        // Prevent removal if the member has any assigned stories
        if (assignedStory) {
            return res.status(409).json({
                message: "Cannot remove this member because they have assigned user stories. Reassign, unassign, or delete their stories first."
            });
        }


        const result = await projectMemberships.deleteOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Membership not found"
            });
        }

        res.status(200).json({
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Remove project member error:", error);
        res.status(500).json({
            message: "Could not remove project member"
        });
    }
});

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

connectDatabase();

app.post("/signup", async (req, res) => {
    try {
        const { f_name, l_name, username, password } = req.body;

        if (!f_name || !l_name || !username || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await users.findOne({
            username: username
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        await users.insertOne({
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        });

        res.status(201).json({
            message: "User created successfully"
        });

    } catch (error) {
        console.error("Signup error:");
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const user = await users.findOne({
            username: username
        });

        if (!user) {
            return res.status(401).json({
                message: "Username not found"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login error:");
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


 // PA4: Get all user stories for a selected project
app.get("/projects/:projectId/stories", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId } = req.params;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);

        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const stories = await userStories.aggregate([
            {
                $match: {
                    project_id: projectObjectId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_user_id",
                    foreignField: "_id",
                    as: "assignedMember"
                }
            },
            {
                $addFields: {
                    assigned_member_name: {
                        $ifNull: [
                            {
                                $concat: [
                                    {
                                        $arrayElemAt: [
                                            "$assignedMember.f_name", 0
                                        ]
                                    },
                                    " ",
                                    {
                                        $arrayElemAt: [
                                            "$assignedMember.l_name", 0
                                        ]
                                    }
                                ]
                            },
                            "Unassigned"
                        ]
                    }
                }
            },
            {
                $project: {
                    assignedMember: 0
                }
            }
        ]).toArray();

        res.json(stories);

    } catch (error) {
        console.error("Get stories error:", error);
        res.status(500).json({
            message: "Server error while loading user stories"
        });
    }
});


 // PA4: Create a new user story for a project
app.post("/projects/:projectId/stories", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId } = req.params;
        const { title, description, priority, assigned_user_id } = req.body;

        // Check that the project ID is valid
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                message: "Invalid project ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);

        // Check that the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Validate required fields
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            !["High", "Medium", "Low"].includes(priority)
        ) {
            return res.status(400).json({
                message: "Valid title, description, and priority are required"
            });
        }

        // Stories can be unassigned
        let assignedUserId = null;

        if (assigned_user_id !== null &&
            assigned_user_id !== undefined &&
            assigned_user_id !== "") {

            if (
                typeof assigned_user_id !== "string" ||
                !ObjectId.isValid(assigned_user_id)
            ) {
                return res.status(400).json({
                    message: "Invalid assigned user ID"
                });
            }

            assignedUserId = new ObjectId(assigned_user_id);

            // Verify the user exists
            const user = await users.findOne({
                _id: assignedUserId
            });

            if (!user) {
                return res.status(400).json({
                    message: "Assigned user does not exist"
                });
            }

            // Verify the user belongs to this project
            const membership = await projectMemberships.findOne({
                project_id: projectObjectId,
                user_id: assignedUserId
            });

            if (!membership &&
                !project.project_lead_id.equals(assignedUserId)) {
                return res.status(400).json({
                    message: "Assigned user must be a member of this project"
                });
            }
        }

        // New stories always start with To Do status
        const story = {
            project_id: projectObjectId,
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            status: "To Do",
            assigned_user_id: assignedUserId
        };

        // Save the story to MongoDB
        const result = await userStories.insertOne(story);

        res.status(201).json({
            message: "User story created successfully",
            story: {
                _id: result.insertedId,
                ...story
            }
        });

    } catch (error) {
        console.error("Create user story error:", error);

        res.status(500).json({
            message: "Could not create user story"
        });
    }
});



 // PA4: Edit an existing user story
app.put("/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId, storyId } = req.params;
        const { title, description, priority, status, assigned_user_id } = req.body;

        // Validate project and story IDs
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({
                message: "Invalid project ID or story ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const storyObjectId = new ObjectId(storyId);

        // Verify that the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Find the story within the selected project
        const existingStory = await userStories.findOne({
            _id: storyObjectId,
            project_id: projectObjectId
        });

        if (!existingStory) {
            return res.status(404).json({
                message: "Story not found in this project"
            });
        }

        // Validate required story fields
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            !["High", "Medium", "Low"].includes(priority) ||
            !["To Do", "In Progress", "Done"].includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid title, description, priority, or status"
            });
        }

        // Allow stories to be unassigned
        let assignedUserId = null;

        if (assigned_user_id !== null &&
            assigned_user_id !== undefined &&
            assigned_user_id !== "") {

            if (
                typeof assigned_user_id !== "string" ||
                !ObjectId.isValid(assigned_user_id)
            ) {
                return res.status(400).json({
                    message: "Invalid assigned user ID"
                });
            }

            assignedUserId = new ObjectId(assigned_user_id);

            // Verify that the assigned user exists
            const user = await users.findOne({
                _id: assignedUserId
            });

            if (!user) {
                return res.status(400).json({
                    message: "Assigned user does not exist"
                });
            }

            // Verify membership in the selected project
            const membership = await projectMemberships.findOne({
                project_id: projectObjectId,
                user_id: assignedUserId
            });

            if (!membership &&
                !project.project_lead_id.equals(assignedUserId)) {
                return res.status(400).json({
                    message: "Assigned user must belong to this project"
                });
            }
        }

        // Update only editable fields, keeping project_id unchanged
        const updates = {
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            assigned_user_id: assignedUserId
        };

        await userStories.updateOne(
            {
                _id: storyObjectId,
                project_id: projectObjectId
            },
            {
                $set: updates
            }
        );

        res.status(200).json({
            message: "User story updated successfully",
            story: {
                ...existingStory,
                ...updates
            }
        });

    } catch (error) {
        console.error("Update user story error:", error);

        res.status(500).json({
            message: "Could not update user story"
        });
    }
});


 // PA4: Delete a user story from a project
app.delete("/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");
        const { projectId, storyId } = req.params;

        // Validate the project and story IDs
        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({
                message: "Invalid project ID or story ID"
            });
        }

        const projectObjectId = new ObjectId(projectId);
        const storyObjectId = new ObjectId(storyId);

        // Check whether the project exists
        const project = await projects.findOne({
            _id: projectObjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Delete only the story belonging to this project
        const result = await userStories.deleteOne({
            _id: storyObjectId,
            project_id: projectObjectId
        });

        // Check whether a story was deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Story not found in this project"
            });
        }

        res.status(200).json({
            message: "User story deleted successfully"
        });

    } catch (error) {
        console.error("Delete user story error:", error);

        res.status(500).json({
            message: "Could not delete user story"
        });
    }
});



app.listen(9000, () => {
    console.log("Server running on port 9000");
});