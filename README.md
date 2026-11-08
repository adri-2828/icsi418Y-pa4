# ICSI 418Y Programming Assignment 4

## Project Management and User Stories

This project extends the full-stack application from Programming Assignment 3 by adding User Story management and project backlogs.

The application uses a React frontend, an Express backend, and MongoDB Atlas for data storage.

## Features

### User Authentication
- User signup and login

### Project Management
- Create software projects with a name and description
- Set project status to Planning, Active, or Completed
- Assign a registered user as Project Lead
- Automatically add the Project Lead as a project member
- View projects and manage project memberships
- Prevent duplicate project memberships
- Prevent removal of the current Project Lead

### User Stories and Project Backlogs
- Create User Stories with a title and description
- Set story priority to High, Medium, or Low
- Track story status as To Do, In Progress, or Done
- Assign stories to project members or leave them Unassigned
- View stories belonging to the selected project
- Edit existing User Stories
- Delete User Stories with confirmation
- Prevent removal of members assigned to User Stories, including completed stories
- Validate User Story information
- Automatically refresh the backlog after changes
- Reset the backlog and form when switching projects

## Technologies Used
- React and Vite
- JavaScript
- Node.js and Express
- MongoDB Atlas
- REST API

## Running the Application
### Prerequisites

Before running the application, make sure you have:

- Node.js and npm installed
- Access to a MongoDB Atlas database
- A MongoDB connection string

### 1. Install Backend Dependencies

Open a terminal in the project folder:

```bash
cd server
npm install
```

### 2. Configure MongoDB

Create a `.env` file inside the `server` folder.

Add the following environment variable:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

Replace `your_mongodb_atlas_connection_string` with your own MongoDB Atlas connection string.

Make sure your MongoDB Atlas network access settings allow your connection.

**Important:** Never upload your `.env` file to GitHub because it contains sensitive database credentials.

### 3. Start the Backend

From the `server` directory, run:

```bash
node server.js
```

The backend runs on:

`http://localhost:9000`

### 4. Install Frontend Dependencies

Open a second terminal in the project folder:

```bash
cd client
npm install
```

### 5. Start the Frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

### 6. Using the Application

1. Create an account or log in.
2. Create a project and select a Project Lead.
3. Add registered users as project members.
4. Select a project to view its backlog.
5. Create User Stories and assign priorities and members.
6. Edit stories to change their information, status, or assignment.
7. Delete stories when they are no longer needed.
8. Switch between projects to view their separate backlogs.

## Repository Structure

- `client/` — React frontend
- `client/src/components/` — Login, Signup, ProjectDashboard, and ProjectBacklog components
- `server/` — Express backend and MongoDB operations
- `.gitignore` — Excludes dependencies and sensitive configuration files
- `README.md` — Project documentation