import type { Route } from "./+types/logout";
import { redirect, Form, Link, useSubmit } from "react-router";
import { getSession, destroySession } from "../server/sessions";
import { useEffect } from "react";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function LogoutRoute() {
  const submit = useSubmit();

  useEffect(() => {
    // Automatically submit the logout form when component mounts
    submit(null, { method: "post" });
  }, [submit]);

  return null;
}
