
import { useEffect, useState } from "react";

function ProjectBacklog({ projectId }) {
    const [stories, setStories] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // PA4: Form fields for creating user stories
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [members, setMembers] = useState([]);

    // PA4: Form fields for editing existing user stories
    const [editingStoryId, setEditingStoryId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState("Medium");
    const [editStatus, setEditStatus] = useState("To Do");
    const [editAssignedUserId, setEditAssignedUserId] = useState("");

    // PA4: Load stories whenever the selected project changes
    useEffect(() => {
        if (!projectId) {
            setStories([]);
            setMembers([]);
            setEditingStoryId(null);
            return;
        }

        let cancelled = false;

        const loadStories = async () => {
            setLoading(true);
            setStories([]);
            setMembers([]);
            setMessage("");

            setTitle("");
            setDescription("");
            setPriority("Medium");
            setAssignedUserId("");

            setEditingStoryId(null);
            setEditTitle("");
            setEditDescription("");
            setEditPriority("Medium");
            setEditStatus("To Do");
            setEditAssignedUserId("");

            try {
                const [storiesResponse, membersResponse] =
                    await Promise.all([
                        fetch(
                            `http://localhost:9000/projects/${projectId}/stories`
                        ),
                        fetch(
                            `http://localhost:9000/projects/${projectId}/members`
                        )
                    ]);

                if (!storiesResponse.ok || !membersResponse.ok) {
                    throw new Error("Could not load project data");
                }

                const storiesData = await storiesResponse.json();
                const membersData = await membersResponse.json();

                if (!cancelled) {
                    setStories(storiesData);
                    setMembers(membersData);
                }
            } catch (error) {
                if (!cancelled) {
                    setMessage(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadStories();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    // PA4: Get the members available for story assignments
    const loadMembers = async () => {
        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/members`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load members");
            }

            setMembers(data);
        } catch (error) {
            setMessage(error.message);
        }
    };

    // PA4: Refresh the project backlog
    const refreshStories = async () => {
        const response = await fetch(
            `http://localhost:9000/projects/${projectId}/stories`
        );

        if (!response.ok) {
            throw new Error("Could not refresh project backlog");
        }

        const data = await response.json();
        setStories(data);
    };

    // PA4: Create a new user story
    const createStory = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/stories`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        priority,
                        assigned_user_id: assignedUserId || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not create story");
            }

            setMessage("User story created successfully!");

            // Clear the form
            setTitle("");
            setDescription("");
            setPriority("Medium");
            setAssignedUserId("");

            // Refresh the project backlog
            await refreshStories();
            await loadMembers();

        } catch (error) {
            setMessage(error.message);
        }
    };

    // PA4: Start editing an existing user story
    const startEditing = (story) => {
        setEditingStoryId(story._id);
        setEditTitle(story.title);
        setEditDescription(story.description);
        setEditPriority(story.priority);
        setEditStatus(story.status);
        setEditAssignedUserId(story.assigned_user_id || "");
        setMessage("");
    };

    // PA4: Cancel editing and close the edit form
    const cancelEditing = () => {
        setEditingStoryId(null);
    };

    // PA4: Delete a user story after confirmation
    const deleteStory = async (story) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${story.title}"?`
        );

        if (!confirmed) {
            return;
        }

        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/stories/${story._id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete user story");
            }

            // Refresh the project backlog after deleting
            await refreshStories();

            if (editingStoryId === story._id) {
                setEditingStoryId(null);
            }

            setMessage("User story deleted successfully!");

        } catch (error) {
            setMessage(error.message);
        }
    };

    // PA4: Save changes to an existing user story
    const saveStory = async (event) => {
        event.preventDefault();
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/stories/${editingStoryId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: editTitle,
                        description: editDescription,
                        priority: editPriority,
                        status: editStatus,
                        assigned_user_id: editAssignedUserId || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update user story");
            }

            // Refresh the project backlog after editing
            await refreshStories();

            setEditingStoryId(null);
            setMessage("User story updated successfully!");

        } catch (error) {
            setMessage(error.message);
        }
    };

    if (!projectId) {
        return <p>Select a project to view its backlog.</p>;
    }

    return (
        <section className="dashboard-section">
            <h2>Project Backlog</h2>

            <h3>Create User Story</h3>

            <form onSubmit={createStory}>
                <input
                    type="text"
                    placeholder="Story title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                />

                <textarea
                    placeholder="As a user, I want..., so that..."
                    value={description}
                    onChange={(event) =>
                        setDescription(event.target.value)
                    }
                    required
                />

                <div className="form-row">
                    <div className="form-field">
                        <label>Priority</label>
                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Assigned Member</label>
                        <select
                            value={assignedUserId}
                            onChange={(event) =>
                                setAssignedUserId(event.target.value)
                            }
                        >
                            <option value="">Unassigned</option>

                            {members.map((member) => (
                                <option
                                    key={member._id}
                                    value={member._id}
                                >
                                    {member.f_name} {member.l_name}
                                    {" "}({member.username})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit">
                    Create User Story
                </button>
            </form>

            {message && <p>{message}</p>}

            {loading ? (
                <p>Loading user stories...</p>
            ) : stories.length === 0 ? (
                <p>
                    No user stories have been created for this project.
                </p>
            ) : (
                <div className="project-grid">
                    {stories.map((story) => (
                        <div
                            className="project-card"
                            key={story._id}
                        >
                            <h3>{story.title}</h3>

                            <p>{story.description}</p>

                            <div className="project-details">
                                <p>
                                    <span>Priority</span>
                                    {story.priority}
                                </p>

                                <p>
                                    <span>Status</span>
                                    {story.status}
                                </p>

                                <p>
                                    <span>Assigned Member</span>
                                    {story.assigned_member_name ||
                                        "Unassigned"}
                                </p>
                            </div>

                            {/* PA4: Edit an existing user story */}
                            <button
                                type="button"
                                onClick={() => startEditing(story)}
                            >
                                Edit Story
                            </button>

                            {/* PA4: Delete an existing user story */}
                            <button
                                type="button"
                                onClick={() => deleteStory(story)}
                            >
                                Delete Story
                            </button>

                            {editingStoryId === story._id && (
                                <form onSubmit={saveStory}>
                                    <h3>Edit User Story</h3>

                                    <input
                                        type="text"
                                        placeholder="Story title"
                                        value={editTitle}
                                        onChange={(event) =>
                                            setEditTitle(event.target.value)
                                        }
                                        required
                                    />

                                    <textarea
                                        placeholder="Story description"
                                        value={editDescription}
                                        onChange={(event) =>
                                            setEditDescription(event.target.value)
                                        }
                                        required
                                    />

                                    <div className="form-field">
                                        <label>Priority</label>
                                        <select
                                            value={editPriority}
                                            onChange={(event) =>
                                                setEditPriority(event.target.value)
                                            }
                                        >
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Status</label>
                                        <select
                                            value={editStatus}
                                            onChange={(event) =>
                                                setEditStatus(event.target.value)
                                            }
                                        >
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Assigned Member</label>
                                        <select
                                            value={editAssignedUserId}
                                            onChange={(event) =>
                                                setEditAssignedUserId(event.target.value)
                                            }
                                        >
                                            <option value="">Unassigned</option>

                                            {members.map((member) => (
                                                <option
                                                    key={member._id}
                                                    value={member._id}
                                                >
                                                    {member.f_name} {member.l_name}
                                                    {" "}({member.username})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button type="submit">
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ProjectBacklog;
