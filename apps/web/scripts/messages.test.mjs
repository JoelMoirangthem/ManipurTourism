import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { threadUrl, roleCopy, KIND_LABEL } from "../src/lib/messages.ts";

describe("messages lib", () => {
  it("builds thread URLs under /messages", () => {
    assert.equal(threadUrl("abc-123"), "/messages/abc-123");
  });
  it("titles the list per role", () => {
    assert.equal(roleCopy("visitor").title, "My messages");
    assert.equal(roleCopy("provider").title, "Messages for your listings");
    assert.match(roleCopy("reviewer").lede, /read-only/);
  });
  it("labels all availability kinds", () => {
    assert.equal(KIND_LABEL.reported_available, "Host reports available");
    assert.equal(KIND_LABEL.reported_unavailable, "Host reports unavailable");
    assert.equal(KIND_LABEL.needs_details, "Host needs more details");
  });
});
