# AI Rules for HolyHarmonies Application

This document outlines the core technologies used in the HolyHarmonies application and provides guidelines for library usage to maintain consistency and best practices.

## Tech Stack Description

*   **Frontend Framework**: Next.js for building React applications with server-side rendering and static site generation capabilities.
*   **UI Components**: shadcn/ui, built on Radix UI, provides a collection of accessible and customizable UI components.
*   **Styling**: Tailwind CSS is used for utility-first CSS styling, enabling rapid and consistent UI development.
*   **Icons**: Lucide React provides a comprehensive set of customizable SVG icons.
*   **Backend & Database**: Firebase is the primary backend service, utilizing Firestore for real-time NoSQL database operations.
*   **Authentication**: Firebase Authentication handles all user authentication flows, including email/password and potential third-party providers.
*   **Type Checking**: TypeScript is used throughout the codebase for static type checking, enhancing code quality and maintainability.
*   **Routing**: Next.js's file-system based routing is used for navigation within the application.
*   **Unique Identifiers**: The `uuid` library is used for generating universally unique IDs.
*   **Form Management**: React Hook Form is employed for efficient and flexible form handling and validation.
*   **AI Integration**: Genkit is integrated for building and deploying AI-powered features.

## Library Usage Rules

To ensure consistency and leverage existing solutions, please adhere to the following library usage rules:

*   **UI Components**: Always use components from `shadcn/ui` (e.g., `Button`, `Card`, `Input`, `Dialog`, `Select`, `Switch`, `Checkbox`, `ScrollArea`, `Avatar`, `AlertDialog`, `Textarea`) for all standard UI elements. Do not create custom components if a suitable `shadcn/ui` component exists.
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or separate CSS files unless explicitly for global styles in `globals.css`.
*   **Icons**: Use icons from the **`lucide-react`** library.
*   **Data Persistence & Backend**: Firebase (Firestore) is the designated backend and database. Use the provided `useDoc`, `useCollection`, `setDocumentNonBlocking`, `updateDocumentNonBlocking`, and `deleteDocumentNonBlocking` hooks/functions for all Firestore interactions.
*   **Authentication**: Firebase Authentication is the sole provider for user authentication. Use `useAuth`, `useUser`, `initiateEmailSignIn`, and `initiateEmailSignUp` for all authentication-related logic.
*   **Routing**: Follow Next.js's file-system routing conventions.
*   **Unique IDs**: Use the `uuid` library (specifically `v4()`) for generating unique identifiers for new documents (e.g., songs, playlists).
*   **Forms**: Use **`react-hook-form`** for managing form state, validation, and submission.
*   **Toasts**: Utilize the `useToast` hook provided by `shadcn/ui` for all in-app notifications.
*   **Date Manipulation**: Use `date-fns` for any date formatting or manipulation tasks.
*   **AI/ML**: For any AI-related features, integrate with **Genkit**.