import type { Route } from "./+types/login";
import { Form, redirect } from "react-router";
import { getSession, commitSession } from "../server/sessions";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let username = formData.get("username");
  let password = formData.get("password");

  if (!username || username instanceof File) {
    return { error: "Username is required!" };
  }

  if (!password || password instanceof File) {
    return { error: "Invalid username or password." };
  }

  const response = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    return { error: "Invalid username or password." };
  }

  const account = await response.json();

  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", String(account.id));
  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Logins({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <Form method="post">
        <h1 className="bg-content-dark-50 mx-auto w-[200px] p-3 mt-4 mb-1 rounded-xl text-article-name flex justify-center font-bold">
          Account Manager
        </h1>

        <div className="w-[1300px] h-[300px] gap-5 p-9 mx-auto bg-content-dark-50 rounded-xl">
          <div className="max-w-[250px] flex flex-col mx-auto gap-2 p-5 bg-amber-50 rounded-xl">
            <p>Username</p>
            <input className="link" name="username" />
            <p>Password</p>
            <input className="link" type="password" name="password" />
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
