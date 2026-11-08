# ICSI 418Y Programming Assignment 3

## Projects and Project Memberships

This project extends the full-stack application from Programming Assignment 2 by adding project creation and project membership management.

The application uses a React frontend, an Express backend, and MongoDB for data storage.

## Features

- User signup
- User login
- Create software projects
- Add a project name and description
- Set a project status to Planning, Active, or Completed
- Select a registered user as the Project Lead
- Automatically add the Project Lead as a project member
- View created projects
- View the members of a selected project
- Add registered users to projects
- Remove non-lead members from projects
- Prevent duplicate project memberships
- Prevent the current Project Lead from being removed
- Display feedback when operations succeed or fail

## Running the Application

### 1. Install Client Dependencies

Open a terminal in the project folder and run:

```bash
cd client
npm install