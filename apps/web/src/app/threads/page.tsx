import { redirect } from "next/navigation";
// S1 merge: threads live at /messages now. Stub kept so old links 307.
export default function ThreadsRedirect() {
  redirect("/messages");
}
