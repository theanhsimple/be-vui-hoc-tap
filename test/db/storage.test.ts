import { anonClient, bootstrapStaffRole, createUser } from "./helpers";

const file = () =>
  new Blob(["<svg xmlns='http://www.w3.org/2000/svg'/>"], {
    type: "image/svg+xml",
  });

describe("storage buckets", () => {
  it("parents and anonymous visitors cannot upload learning assets", async () => {
    const parent = await createUser("storage-parent");
    for (const client of [parent.client, anonClient()]) {
      const { error } = await client.storage
        .from("public-learning-assets")
        .upload(`test/parent-${Date.now()}.svg`, file());
      expect(error).not.toBeNull();
    }
  });

  it("content editors can upload; disallowed types and paths are refused", async () => {
    const editor = await createUser("storage-editor");
    bootstrapStaffRole(editor.id, "content_editor");
    const ok = await editor.client.storage
      .from("public-learning-assets")
      .upload(`test/editor-${Date.now()}.svg`, file());
    expect(ok.error).toBeNull();
    const badType = await editor.client.storage
      .from("public-learning-assets")
      .upload(
        `test/x-${Date.now()}.txt`,
        new Blob(["x"], { type: "text/plain" }),
      );
    expect(badType.error).not.toBeNull();
    const badPath = await editor.client.storage
      .from("public-learning-assets")
      .upload(`Test/UPPER-${Date.now()}.svg`, file());
    expect(badPath.error).not.toBeNull();
  });
});
