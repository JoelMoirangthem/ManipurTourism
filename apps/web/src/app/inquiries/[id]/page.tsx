import { redirect } from "next/navigation";
// S1 merge: thread view lives at /messages/[id] now.
export default async function InquiryRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/messages/${id}`);
}
