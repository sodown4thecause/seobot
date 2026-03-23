/**
 * Directus Schema Setup Script
 * Run this after creating your Directus project to set up all collections
 */

const schema = {
  collections: [
    {
      collection: "posts",
      schema: {
        name: "posts",
        note: "Blog posts and articles"
      },
      fields: [
        { field: "id", type: "uuid", meta: { interface: "input", special: ["uuid"] }, schema: { is_primary_key: true } },
        { field: "title", type: "string", meta: { interface: "input", options: { placeholder: "Post title" } }, schema: { is_nullable: false } },
        { field: "slug", type: "string", meta: { interface: "input", options: { placeholder: "url-friendly-slug" } }, schema: { is_nullable: false, is_unique: true } },
        { field: "published_at", type: "timestamp", meta: { interface: "datetime" } },
        { field: "image", type: "uuid", meta: { interface: "file-image", special: ["file"] } },
        { field: "body", type: "text", meta: { interface: "input-rich-text-html", options: { toolbar: ["bold", "italic", "underline", "strikeThrough", "heading", "link", "image", "blockquote", "unorderedList", "orderedList", "code", "codeBlock", "horizontalRule"] } } },
        { field: "status", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Draft", value: "draft" }, { text: "Published", value: "published" }, { text: "Archived", value: "archived" }] } }, schema: { default_value: "draft" } },
        { field: "seo_title", type: "string", meta: { interface: "input", options: { placeholder: "SEO title (optional)" } } },
        { field: "seo_description", type: "text", meta: { interface: "textarea", options: { placeholder: "Meta description" } } }
      ]
    },
    {
      collection: "guides",
      schema: {
        name: "guides",
        note: "SEO guides and tutorials"
      },
      fields: [
        { field: "id", type: "uuid", meta: { interface: "input", special: ["uuid"] }, schema: { is_primary_key: true } },
        { field: "title", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
        { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
        { field: "published_at", type: "timestamp", meta: { interface: "datetime" } },
        { field: "image", type: "uuid", meta: { interface: "file-image", special: ["file"] } },
        { field: "difficulty", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Beginner", value: "beginner" }, { text: "Intermediate", value: "intermediate" }, { text: "Advanced", value: "advanced" }] } } },
        { field: "read_time", type: "integer", meta: { interface: "input", options: { placeholder: "Minutes to read" } } },
        { field: "excerpt", type: "text", meta: { interface: "textarea", options: { placeholder: "Short description" } } },
        { field: "body", type: "text", meta: { interface: "input-rich-text-html" } },
        { field: "status", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Draft", value: "draft" }, { text: "Published", value: "published" }, { text: "Archived", value: "archived" }] } }, schema: { default_value: "draft" } }
      ]
    },
    {
      collection: "case_studies",
      schema: {
        name: "case_studies",
        note: "Client case studies"
      },
      fields: [
        { field: "id", type: "uuid", meta: { interface: "input", special: ["uuid"] }, schema: { is_primary_key: true } },
        { field: "title", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
        { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
        { field: "published_at", type: "timestamp", meta: { interface: "datetime" } },
        { field: "image", type: "uuid", meta: { interface: "file-image", special: ["file"] } },
        { field: "client", type: "string", meta: { interface: "input", options: { placeholder: "Client name" } } },
        { field: "industry", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "E-commerce", value: "ecommerce" }, { text: "SaaS", value: "saas" }, { text: "Healthcare", value: "healthcare" }, { text: "Finance", value: "finance" }, { text: "Education", value: "education" }, { text: "Real Estate", value: "real-estate" }, { text: "Other", value: "other" }] } } },
        { field: "results", type: "json", meta: { interface: "list", options: { template: "{{result}}", fields: [{ field: "result", type: "string", name: "result" }] } } },
        { field: "excerpt", type: "text", meta: { interface: "textarea" } },
        { field: "body", type: "text", meta: { interface: "input-rich-text-html" } },
        { field: "status", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Draft", value: "draft" }, { text: "Published", value: "published" }] } }, schema: { default_value: "draft" } }
      ]
    },
    {
      collection: "resources",
      schema: {
        name: "resources",
        note: "Downloadable resources"
      },
      fields: [
        { field: "id", type: "uuid", meta: { interface: "input", special: ["uuid"] }, schema: { is_primary_key: true } },
        { field: "title", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
        { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
        { field: "published_at", type: "timestamp", meta: { interface: "datetime" } },
        { field: "image", type: "uuid", meta: { interface: "file-image", special: ["file"] } },
        { field: "category", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Template", value: "template" }, { text: "Checklist", value: "checklist" }, { text: "Toolkit", value: "toolkit" }, { text: "Whitepaper", value: "whitepaper" }, { text: "Ebook", value: "ebook" }, { text: "Webinar", value: "webinar" }, { text: "Tool", value: "tool" }] } } },
        { field: "excerpt", type: "text", meta: { interface: "textarea" } },
        { field: "download_url", type: "string", meta: { interface: "input", options: { placeholder: "https://..." } } },
        { field: "body", type: "text", meta: { interface: "input-rich-text-html" } },
        { field: "status", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Draft", value: "draft" }, { text: "Published", value: "published" }] } }, schema: { default_value: "draft" } }
      ]
    }
  ]
};

console.log(JSON.stringify(schema, null, 2));
