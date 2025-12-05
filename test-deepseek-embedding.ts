/**
 * TEST: DeepSeek Embedding Model
 *
 * Mục tiêu:
 * - Gọi trực tiếp endpoint embeddings của DeepSeek
 * - Kiểm tra DEEPSEEK_API_KEY và model embedding đang hoạt động
 *
 * Cách chạy:
 *   1. Đảm bảo trong .env có:
 *        DEEPSEEK_API_KEY=sk-...
 *   2. Chạy:
 *        npx tsx test-deepseek-embedding.ts
 */

import 'dotenv/config'

async function testDeepSeekEmbedding() {
  const apiKey = process.env.DEEPSEEK_API_KEY

  console.log('========== DEEPSEEK EMBEDDING TEST ==========\n')

  if (!apiKey) {
    console.log('❌ DEEPSEEK_API_KEY không tìm thấy trong .env')
    console.log('   Hãy thêm dòng sau vào .env rồi chạy lại:\n')
    console.log('   DEEPSEEK_API_KEY=sk-...your_deepseek_key...\n')
    return
  }

  console.log('✅ DEEPSEEK_API_KEY đã được load')
  console.log(`   Key: ${apiKey.substring(0, 12)}...${apiKey.slice(-4)}`)
  console.log('   Length:', apiKey.length, 'characters\n')

  // Model embedding đang dùng trong pipeline (mặc định là deepseek-chat)
  const model = process.env.EMBEDDING_MODEL || 'deepseek-chat'

  console.log('📦 Testing DeepSeek embedding model:')
  console.log('   Model :', model)
  console.log('   Endpoint: https://api.deepseek.com/v1/embeddings\n')

  const inputs = [
    'AI is transforming marketing strategies by enabling personalized campaigns.',
    'Content marketing focuses on creating valuable, relevant content for a specific audience.',
  ]

  try {
    const res = await fetch('https://api.deepseek.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: inputs,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.log(`❌ Embedding API Error (${res.status}):`)
      console.log(text)

      if (res.status === 401) {
        console.log('\n⚠️  Authentication failed – kiểm tra lại DEEPSEEK_API_KEY')
      }
      return
    }

    const data = await res.json()
    console.log('✅ Embedding API call thành công!\n')

    // In ra kích thước vector để xác nhận đúng model
    if (Array.isArray(data.data) && data.data.length > 0) {
      const dims = data.data[0].embedding?.length ?? 0
      console.log('Số câu input  :', data.data.length)
      console.log('Số chiều vector:', dims)
      console.log('\nVí dụ 2 vector đầu (rút gọn):\n')
      data.data.slice(0, 2).forEach((item: any, idx: number) => {
        const preview = (item.embedding as number[]).slice(0, 8).map((v) => v.toFixed(4))
        console.log(`Embedding[${idx}] (first 8 dims): [${preview.join(', ')}] ...`)
      })
    } else {
      console.log('⚠️  Không nhận được data.embedding từ DeepSeek, response:')
      console.dir(data, { depth: null })
    }

    console.log('\n✅ DeepSeek embedding model đang hoạt động bình thường!\n')
  } catch (err: any) {
    console.log('❌ Network / Runtime error:', err?.message || err)
  }

  console.log('\n========== TEST COMPLETED ==========')
}

testDeepSeekEmbedding()


