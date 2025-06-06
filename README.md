# Personal Finance Management App

## Description

This application helps users manage their personal finances by tracking income and expenses. It provides a clear overview of financial health, allowing users to make informed decisions about their spending and savings.

**Key Features:**

*   Track income and expenses
*   Categorize transactions
*   View spending patterns (future feature)
*   Set budgets (future feature)
*   Secure data storage with Supabase

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18.x or v20.x)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [yarn](https://yarnpkg.com/)

## Setup Instructions

Follow these steps to set up the development environment:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    This project requires a Supabase backend. You will need to create a `.env` file in the root directory of the project and add your Supabase project URL and Anon Key.

    Create a file named `.env` in the project root and add the following, replacing the placeholder values with your actual Supabase credentials:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

    You can find these keys in your Supabase project dashboard under Project Settings > API.

## Available Scripts

The following scripts are available to run the application:

*   **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically at `http://localhost:5173`.

*   **Build the application for production:**
    ```bash
    npm run build
    ```
    This command bundles the application into static files for production, located in the `dist` directory.

*   **Run ESLint for code checking:**
    ```bash
    npm run lint
    ```
    This will analyze your code for potential errors and style issues.

*   **Preview the production build locally:**
    ```bash
    npm run preview
    ```
    This command starts a local static web server to preview the files generated by `npm run build`.

## Tech Stack

*   **Frontend:** React, Vite
*   **Backend & Database:** Supabase
*   **Styling:** Tailwind CSS
*   **Language:** JavaScript
```
