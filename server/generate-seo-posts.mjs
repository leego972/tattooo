/**
 * Generate remaining tattoo SEO blog posts (the 3 that failed due to column name mismatch).
 * Run with: cd /home/ubuntu/tatt-ooo && npx tsx server/generate-seo-posts.mjs
 */

const TOPICS = [
  { topic: "Japanese tattoo meaning: symbolism, history, and design guide", focusKeyword: "Japanese tattoo meaning", category: "styles" },
  { topic: "How AI is revolutionising tattoo design in 2026", focusKeyword: "AI tattoo design", category: "technology" },
  { topic: "Tattoo cover-up ideas: how to fix a tattoo you regret", focusKeyword: "tattoo cover up ideas", category: "guides" },
  { topic: "How to choose the right tattoo artist for your style", focusKeyword: "how to choose tattoo artist", category: "guides" },
];

async function generatePost(topicConfig) {
  console.log(`\n[Generate] "${topicConfig.topic}"...`);
  
  const { invokeLLM } = await import('./_core/llm.js');
  const { getDb } = await import('./db.js');
  const { blogPosts } = await import('../drizzle/schema.js');
  const { eq } = await import('drizzle-orm');
  
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert SEO content writer for tattooo.shop, the world's leading AI-powered tattoo design and artist booking platform. Write a comprehensive, SEO-optimized blog post in markdown. Return JSON with: title, slug, excerpt, content (full markdown article, minimum 800 words), metaTitle, metaDescription, tags (array of 5 strings), secondaryKeywords (array of 5 strings).`
      },
      {
        role: "user",
        content: `Topic: "${topicConfig.topic}" | Focus keyword: "${topicConfig.focusKeyword}" | Category: ${topicConfig.category}. Make it genuinely useful, well-structured with H2/H3 headings, and naturally mention tattooo.shop as the platform to use.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "blog_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            slug: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            metaTitle: { type: "string" },
            metaDescription: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            secondaryKeywords: { type: "array", items: { type: "string" } },
          },
          required: ["title", "slug", "excerpt", "content", "metaTitle", "metaDescription", "tags", "secondaryKeywords"],
          additionalProperties: false,
        }
      }
    }
  });

  const generated = JSON.parse(response.choices[0].message.content);
  
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  // Check if slug already exists
  const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, generated.slug)).limit(1);
  if (existing.length > 0) {
    console.log(`  [Skip] Slug "${generated.slug}" already exists`);
    return { title: generated.title, slug: generated.slug, status: 'skipped' };
  }
  
  // Use Drizzle TypeScript property names (NOT DB column names)
  await db.insert(blogPosts).values({
    slug: generated.slug,
    title: generated.title,           // maps to blog_title column
    excerpt: generated.excerpt,
    content: generated.content,        // maps to blog_content column
    category: topicConfig.category,
    tags: JSON.stringify(generated.tags),
    metaTitle: generated.metaTitle,
    metaDescription: generated.metaDescription,
    focusKeyword: topicConfig.focusKeyword,
    secondaryKeywords: JSON.stringify(generated.secondaryKeywords),
    seoScore: 85,
    readingTimeMinutes: Math.ceil(generated.content.split(' ').length / 200),
    status: 'published',               // maps to blog_status column
    publishedAt: new Date(),
    aiGenerated: true,                 // maps to blog_aiGenerated column
  });
  
  console.log(`  [Done] "${generated.title}" → /${generated.slug}`);
  return { title: generated.title, slug: generated.slug, status: 'created' };
}

async function main() {
  console.log('[SEO Generator] Generating remaining 4 tattoo SEO blog posts...\n');
  const results = [];
  
  for (const topic of TOPICS) {
    try {
      const result = await generatePost(topic);
      results.push(result);
    } catch (err) {
      console.error(`  [Error] ${topic.topic}: ${err.message}`);
      results.push({ title: topic.topic, slug: '', status: 'error' });
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n[SEO Generator] Complete!');
  console.log('Results:');
  results.forEach(r => console.log(`  ${r.status}: ${r.title}`));
}

main().catch(console.error);
