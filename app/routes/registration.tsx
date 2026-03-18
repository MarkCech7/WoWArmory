import type { Route } from "./+types/registration";
import { Form, redirect } from "react-router";
import { getSession, commitSession } from "../server/sessions";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let username = formData.get("username");
  let password = formData.get("password");
  let confirmPassword = formData.get("confirm-password");
  let email = formData.get("email");

  if (!username || username instanceof File) {
    return { error: "Username is required!" };
  }

  if (!password || password instanceof File) {
    return { error: "Password is required!" };
  }

  if (!confirmPassword || confirmPassword instanceof File) {
    return { error: "Please confirm your password." };
  }

  if (password != confirmPassword) {
    return { error: "Passwords does not match!" };
  }

  if (!email || email instanceof File) {
    return { error: "Email is required!" };
  }

  const response = await fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });

  if (response.status === 409) {
    return { error: "Username or email already taken!" };
  }

  if (!response.ok) {
    return { error: "Failed to create account!" };
  }

  const account = await response.json();

  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", String(account.id));
  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Register({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <Form method="post">
        <h1 className="bg-content-dark-50 mx-auto w-[200px] p-3 mt-4 mb-1 rounded-xl text-article-name flex justify-center font-bold">
          Registration
        </h1>
        <div className="w-[1300px] h-[400px] gap-5 p-9 mx-auto bg-content-dark-50 rounded-xl">
          <div className="max-w-[250px] flex flex-col mx-auto gap-2 p-5 bg-amber-50 rounded-xl">
            <p>Username</p>
            <input className="link" name="username" />
            <p>Password</p>
            <input className="link" type="password" name="password" />
            <p>Confirm Password</p>
            <input className="link" type="password" name="confirm-password" />
            <p>Email</p>
            <input className="link" type="email" name="email" />
            <button type="submit" className="link">
              Submit
            </button>
            {actionData?.error ? <p>{actionData.error}</p> : null}
          </div>
        </div>
      </Form>
    </div>
  );
}
