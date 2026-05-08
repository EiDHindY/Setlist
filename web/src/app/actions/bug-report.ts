"use server"

export async function submitBugReport(description: string, imageUrls: string[]) {
  const NOTION_API_SECRET = process.env.NOTION_API_SECRET;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_SECRET || !NOTION_DATABASE_ID) {
    throw new Error("Missing Notion credentials");
  }

  const files = imageUrls.map((url, idx) => ({
    name: `Screenshot ${idx + 1}`,
    type: "external",
    external: { url },
  }));

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_SECRET}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Bug Report - ${new Date().toLocaleString()}`
              }
            }
          ]
        },
        Description: {
          rich_text: [
            {
              text: {
                content: description || "No description provided."
              }
            }
          ]
        },
        Images: {
          files: files
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Notion API Error:", errorText);
    throw new Error("Failed to submit bug report to Notion");
  }

  return { success: true };
}
