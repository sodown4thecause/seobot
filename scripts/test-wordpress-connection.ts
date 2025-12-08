/**
 * Test script to verify WordPress GraphQL connection
 */

import { getPosts, getPostBySlug } from '../lib/wordpress'

async function testWordPressConnection() {
    console.log('🔍 Testing WordPress GraphQL connection...\n')

    try {
        // Test fetching posts
        console.log('📝 Fetching posts...')
        const { posts } = await getPosts(5)

        console.log(`✅ Successfully fetched ${posts.nodes.length} posts`)
        console.log(`   Has next page: ${posts.pageInfo.hasNextPage}`)

        if (posts.nodes.length > 0) {
            console.log('\n📄 First post:')
            const firstPost = posts.nodes[0]
            console.log(`   Title: ${firstPost.title}`)
            console.log(`   Slug: ${firstPost.slug}`)
            console.log(`   Author: ${firstPost.author.name}`)
            console.log(`   Date: ${firstPost.date}`)
            console.log(`   Has featured image: ${!!firstPost.featuredImage}`)
            console.log(`   Categories: ${firstPost.categories?.nodes.map(c => c.name).join(', ') || 'None'}`)

            // Test fetching a single post
            console.log(`\n📖 Fetching single post by slug: ${firstPost.slug}`)
            const singlePost = await getPostBySlug(firstPost.slug)

            if (singlePost) {
                console.log(`✅ Successfully fetched post: ${singlePost.title}`)
                console.log(`   Content length: ${singlePost.content.length} characters`)
            } else {
                console.log('❌ Failed to fetch single post')
            }
        }

        console.log('\n✅ All tests passed! WordPress GraphQL connection is working.')
        process.exit(0)
    } catch (error) {
        console.error('\n❌ Error testing WordPress connection:')
        console.error(error)
        process.exit(1)
    }
}

testWordPressConnection()
