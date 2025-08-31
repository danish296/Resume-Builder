// /app/api/your-route-path/route.ts

import { NextResponse } from "next/server";
import { getSql } from "@/lib/db"; // Assuming this is your database connection utility
import { hashPassword } from "@/lib/auth"; // Assuming this is your password hashing utility

export async function POST(req: Request) {
  try {
    // 1. Get and validate the request body
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 2. Validate password strength and email format
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Hash the password
    const hashedPassword = await hashPassword(password);

    // 4. Insert the new user into the database
    // The user is set to verified immediately as per your original logic.
    const sql = getSql();
    const result = await sql/*sql*/`
      INSERT INTO users (email, password_hash, name, is_verified) 
      VALUES (${email}, ${hashedPassword}, ${name || null}, true) 
      RETURNING id
    `;

    if (result.length === 0) {
      // This case handles if the insert somehow fails without throwing an error
      throw new Error("User creation failed in the database.");
    }
    
    const userId = result[0].id as string;
    console.log(`Successfully created user with ID: ${userId}`);

    // 5. Return a success response
    // The 'verifyUrl' logic was removed as the 'token' was undefined and
    // the user is already being created as 'verified'.
    return NextResponse.json(
      { message: "User created successfully!", userId: userId },
      { status: 201 }
    );

  } catch (e: unknown) {
    // This single catch block handles ALL errors from the 'try' block.
    console.error("Signup API Error:", e); // Log the full error for debugging

    let errorMessage = "An unexpected error occurred.";
    let statusCode = 500; // Default to Internal Server Error

    // Safely check the error type and message
    if (e instanceof Error) {
      // Check for a unique constraint violation from the database
      if (e.message.toLowerCase().includes("unique")) {
        errorMessage = "This email address is already registered.";
        statusCode = 409; // 409 Conflict is the correct status for duplicates
      } else {
        errorMessage = e.message;
      }
    }

    // Return a standardized error response
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}