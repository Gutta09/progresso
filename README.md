# Progresso

Progresso is a web-based task management system built around a Kanban workflow. It supports secure user authentication and full task CRUD operations across the default columns **To Do**, **In Progress**, and **Done**.

## Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS 4
- Mongoose ODM
- MongoDB
- Cookie-based session authentication with hashed passwords

## Implemented Features

- User registration with unique usernames
- User login and logout
- Password hashing with `bcryptjs`
- Protected dashboard per authenticated user
- Task creation with title, description, and status
- Task editing and status updates
- Task deletion
- Responsive three-column Kanban layout

## Local Setup

1. Install dependencies:

	`npm install`

2. Ensure MongoDB is running locally (or set a cloud URI).

3. Start the development server:

	`npm run dev`

4. Open `http://localhost:3000` in the browser.

## Environment Variables

Create a `.env` file with the following values:

`MONGODB_URI="mongodb://127.0.0.1:27017/progresso"`

`SESSION_SECRET="replace-with-a-long-random-secret"`

## Project Notes

- Each user only sees and manages their own tasks.
- Status updates are handled through the edit form on each task card.
- Data is stored in MongoDB using Mongoose models.

## Validation

- `npm run lint`
- `npm run build`
