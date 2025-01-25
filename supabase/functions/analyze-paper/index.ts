import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'
import { Anthropic } from "@anthropic-ai/sdk";

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { paperId, filePath } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!supabaseUrl || !supabaseKey || !anthropicKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: anthropicKey
    })

    // Download file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('papers')
      .download(filePath)

    if (fileError) throw fileError

    if (!fileData) {
      throw new Error('No file data received')
    }

    // Convert Blob to ArrayBuffer, then to Uint8Array
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Convert file to text
    const documentText = await extractTextFromFile(uint8Array)

    // Analyze document with Claude
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Analyze this academic document and provide a comprehensive review:

Document Content:
${documentText}

Please provide:
1. Overall assessment
2. Key strengths
3. Areas for improvement
4. Suggested grade with justification`
        }
      ]
    })

    // Extract analysis from Claude's response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const analysis = content.text

    // Return analysis
    return new Response(JSON.stringify({
      score: calculateScore(analysis),
      feedback: analysis
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: corsHeaders
    })
  }
})

// Helper function for text extraction
async function extractTextFromFile(fileData: Uint8Array): Promise<string> {
  // TODO: Implement proper file parsing based on file type
  return new TextDecoder().decode(fileData)
}

// Scoring function
function calculateScore(analysis: string): number {
  // TODO: Implement more sophisticated scoring logic
  return 85 // Example default score
}