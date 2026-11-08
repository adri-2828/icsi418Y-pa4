import { useEffect, useState } from "react";

import ProjectBacklog from "./ProjectBacklog";

function ProjectDashboard({ loggedInUser, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [projectLeadId, setProjectLeadId] = useState(loggedInUser._id);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [message, setMessage] = useState("");
    const [showConfetti, setShowConfetti] = useState(false);

    //loads the projects and registered users
    useEffect(() => {
        loadProjects();
        loadUsers();
    }, []);

    //gets all projects from the server
    const loadProjects = async () => {
        try {
            const response = await fetch("http://localhost:9000/projects");
            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not load projects");
                return;
            }

            setProjects(data);
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to the server");
        }
    };

    //gets all registered users from the server
    const loadUsers = async () => {
        try {
            const response = await fetch("http://localhost:9000/users");
            const data = await response.json();

            if (!response.ok) {
                setMessage("Could not load users");
                return;
            }

            setUsers(data);
        } catch (error) {
            console.error(error);
            setMessage("Could not load registered users");
        }
    };

    //creates a new project
    const createProject = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const response = await fetch("http://localhost:9000/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName,
                    description: description,
                    status: status,
                    project_lead_id: projectLeadId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not create project");
                return;
            }

            setMessage(
                "Project created successfully. The project lead is automatically a member."
            );

            setShowConfetti(true);

            setTimeout(() => {
                setShowConfetti(false);
            }, 2500);

            setProjectName("");
            setDescription("");
            setStatus("Planning");
            await loadProjects();
            setSelectedProjectId(data._id);
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to the server");
        }
    };

    //loads members for the selected project
    const loadMembers = async (projectId) => {
        setSelectedProjectId(projectId);
        setMembers([]);
        setSelectedUserId("");
        setMessage("");

        if (!projectId) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/members`
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not load project members");
                return;
            }

            setMembers(data);
        } catch (error) {
            console.error(error);
            setMessage("Could not load project members");
        }
    };

    //adds a registered user to a project
    const addMember = async () => {
        if (!selectedProjectId || !selectedUserId) {
            setMessage("Select a project and a user first");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${selectedProjectId}/members`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: selectedUserId })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not add member");
                return;
            }

            setMessage(data.message || "Member added successfully");
            await loadMembers(selectedProjectId);
        } catch (error) {
            console.error(error);
            setMessage("Could not add project member");
        }
    };

    //removes a member from a project
    const removeMember = async (userId) => {
        try {
            const response = await fetch(
                `http://localhost:9000/projects/${selectedProjectId}/members/${userId}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Could not remove member");
                return;
            }

            setMessage(data.message || "Member removed successfully");
            await loadMembers(selectedProjectId);
        } catch (error) {
            console.error(error);
            setMessage("Could not remove project member");
        }
    };

    return (
        <div className="dashboard">
            {showConfetti && (
                <div className="confetti-container">
                    {Array.from({ length: 40 }).map((_, index) => (
                        <span
                            key={index}
                            className={`confetti confetti-${index % 4}`}
                            style={{
                                left: `${(index * 17) % 100}%`,
                                animationDelay: `${(index % 8) * 0.08}s`,
                                animationDuration: `${2 + (index % 5) * 0.15}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="dashboard-header">
                <div>
                    <h1>Project Dashboard</h1>
                    <p>
                        Welcome, {loggedInUser.f_name} {loggedInUser.l_name}!
                    </p>
                </div>

                <button className="logout-button" onClick={onLogout}>
                    Log Out
                </button>
            </div>

            <section className="dashboard-section">
                <h2>Create a Project</h2>

                <form onSubmit={createProject}>
                    <input
                        type="text"
                        placeholder="Project name"
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                        required
                    />

                    <textarea
                        placeholder="Project description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                    />

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="project-status">Status</label>
                            <select
                                id="project-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                            >
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="project-lead">Project Lead</label>
                            <select
                                id="project-lead"
                                value={projectLeadId}
                                onChange={(event) =>
                                    setProjectLeadId(event.target.value)
                                }
                                required
                            >
                                <option value="">Choose a project lead</option>

                                {users.map((user) => (
                                    <option
                                        key={user._id}
                                        value={user._id}
                                    >
                                        {user.f_name} {user.l_name} (
                                        {user.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit">Create Project</button>
                </form>
            </section>

            <section className="dashboard-section">
                <h2>All Projects</h2>

                {projects.length === 0 ? (
                    <p>No projects have been created yet.</p>
                ) : (
                    <div className="project-grid">
                        {projects.map((project) => (
                            <div
                                className="project-card"
                                key={project._id}
                            >
                                <h3>{project.name}</h3>

                                <p className="project-description">
                                    {project.description}
                                </p>

                                <div className="project-details">
                                    <p>
                                        <span>Status</span>
                                        {project.status}
                                    </p>

                                    <p>
                                        <span>Project Lead</span>
                                        {project.project_lead_name} (
                                        {project.project_lead_username})
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        loadMembers(project._id)
                                    }
                                >
                                    Manage Members
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="dashboard-section">
                <h2>Manage Project Members</h2>

                <label htmlFor="selected-project">
                    Choose a project
                </label>

                <select
                    id="selected-project"
                    value={selectedProjectId}
                    onChange={(event) =>
                        loadMembers(event.target.value)
                    }
                >
                    <option value="">Select a project</option>

                    {projects.map((project) => (
                        <option
                            key={project._id}
                            value={project._id}
                        >
                            {project.name}
                        </option>
                    ))}
                </select>

                {selectedProjectId && (
                    <div className="member-management">
                        <h3>Current Members</h3>

                        {members.length === 0 ? (
                            <p>No members found for this project.</p>
                        ) : (
                            <ul className="member-list">
                                {members.map((member) => (
                                    <li key={member._id}>
                                        <span>
                                            {member.f_name} {member.l_name} (
                                            {member.username})
                                        </span>

                                        <button
                                            className="small-button"
                                            onClick={() =>
                                                removeMember(member._id)
                                            }
                                        >
                                            Remove Member
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <h3>Add a Member</h3>

                        <div className="add-member-row">
                            <select
                                value={selectedUserId}
                                onChange={(event) =>
                                    setSelectedUserId(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Choose a registered user
                                </option>

                                {users
                                    .filter(
                                        (user) =>
                                            !members.some(
                                                (member) =>
                                                    member._id ===
                                                    user._id
                                            )
                                    )
                                    .map((user) => (
                                        <option
                                            key={user._id}
                                            value={user._id}
                                        >
                                            {user.f_name} {user.l_name} (
                                            {user.username})
                                        </option>
                                    ))}
                            </select>

                            <button onClick={addMember}>
                                Add Member
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* PA4: Display user stories for the selected project */}
            {selectedProjectId && (
            <ProjectBacklog projectId={selectedProjectId} />
            )}  
            
            {message && <p className="dashboard-message">{message}</p>}

        </div>
    );
}

export default ProjectDashboard;