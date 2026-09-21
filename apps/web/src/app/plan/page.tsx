import { redirect } from "next/navigation";
// Planning lives in the assistant panel: forward home with panel-open signal.
export default function PlanRedirect() {
  redirect("/?assistant=open&start=plan");
}
