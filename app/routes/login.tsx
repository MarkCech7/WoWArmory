import type { Route } from "./+types/login";
import { loadAccount } from "~/server/db";
import { Form, redirect } from "react-router";
import { calculateSRP6Verifier } from "~/components/auth";
import { getSession, commitSession } from "../server/sessions";

function isEqualBytes(bytes1: Uint8Array, bytes2: Uint8Array): boolean {
  if (bytes1.length !== bytes2.length) {
    return false;
  }

  for (let i = 0; i < bytes1.length; i++) {
    if (bytes1[i] !== bytes2[i]) {
      return false;
    }
  }

  return true;
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let username = formData.get("username");
  let password = formData.get("password");
  if (!username || username instanceof File) {
    return { error: "Username is required!" };
  }

  let account = await loadAccount(username);
  if (!account) {
    return { error: "Invalid username or password." };
  }

  if (!password || password instanceof File) {
    return { error: "Invalid username or password." };
  }

  let calculatedArrayBuffer = await calculateSRP6Verifier(
    username,
    password,
    account.salt
  );

  let calculatedverifier = Buffer.from(calculatedArrayBuffer.buffer);
  let isSame = isEqualBytes(account.verifier, calculatedverifier);

  if (!isSame) {
    return { error: "Invalid username or password." };
  }

  const session = await getSession(request.headers.get("Cookie"));

  session.set("userId", account.id.toString());
  console.log(account.id);
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Logins({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Account Manager</h1>
      <Form method="post">
        <div className="h-[200px] flex flex-col bg-amber-50 gap-2 p-2">
          <p>Username</p>
          <input className="link" name="username" />
          <p>Password</p>
          <input className="link" type="password" name="password" />
          <button type="submit" className="link">
            Submit
          </button>
          {actionData?.error ? <p>{actionData.error}</p> : null}
        </div>
      </Form>
    </div>
  );
}
