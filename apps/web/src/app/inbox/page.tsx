import { redirect } from "next/navigation";
// S1 merge: the inbox live at /messages now. Stub kept so old links 307.
export default function InboxRedirect() {
  redirect("/messages");
}
