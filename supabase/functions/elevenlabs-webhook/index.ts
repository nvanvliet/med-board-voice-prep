
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ElevenLabsConversationWebhookPayload {
  conversation_id: string
  agent_id: string
  user_id?: string
  status: 'conversation_ended' | 'conversation_started' | 'conversation_error'
  transcript?: string
  audio_url?: string
  created_at: string
  metadata?: any
}

interface ConversationDetails {
  conversation_id: string
  transcript: string
  audio_url?: string
  duration_seconds?: number
  created_at: string
  messages?: Array<{
    role: string
    content: string
    timestamp?: string
  }>
}

// Function to verify webhook signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // ElevenLabs sends signature in format "sha256=<hex>"
    const receivedHex = signature.replace('sha256=', '')
    
    return expectedHex === receivedHex
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

// Enhanced function to fetch detailed conversation data from ElevenLabs API
async function getConversationDetails(conversationId: string, apiKey: string): Promise<ConversationDetails | null> {
  try {
    console.log(`Fetching detailed conversation data for: ${conversationId}`)
    
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Failed to fetch conversation: ${response.status} ${response.statusText}`)
      return null
    }

    const conversationData = await response.json()
    console.log('Full conversation data received:', JSON.stringify(conversationData, null, 2))
    
    // Extract all relevant information
    const details: ConversationDetails = {
      conversation_id: conversationId,
      transcript: '',
      created_at: conversationData.created_at || new Date().toISOString()
    }

    // Extract audio URL if available
    if (conversationData.audio_url) {
      details.audio_url = conversationData.audio_url
    }

    // Extract duration if available
    if (conversationData.duration_seconds) {
      details.duration_seconds = conversationData.duration_seconds
    }

    // Extract transcript from various possible formats
    if (conversationData.transcript) {
      details.transcript = conversationData.transcript
    } else if (conversationData.messages && Array.isArray(conversationData.messages)) {
      // Store structured messages
      details.messages = conversationData.messages.map((msg: any) => ({
        role: msg.role || msg.sender || 'unknown',
        content: msg.content || msg.message || '',
        timestamp: msg.timestamp || msg.created_at
      }))
      
      // Create a formatted transcript from messages
      details.transcript = conversationData.messages
        .map((msg: any) => {
          const role = msg.role || msg.sender || 'unknown'
          const content = msg.content || msg.message || ''
          const timestamp = msg.timestamp || msg.created_at
          const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : ''
          return `[${timeStr}] ${role === 'user' ? 'User' : 'Assistant'}: ${content}`
        })
        .join('\n')
    }
    
    return details
  } catch (error) {
    console.error('Error fetching conversation details:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('ElevenLabs conversation webhook received')
    
    // Get the raw payload for signature verification
    const rawPayload = await req.text()
    
    // Verify webhook signature
    const signature = req.headers.get('x-elevenlabs-signature')
    const webhookSecret = 'wsec_ae43f60c85406fbe1cb94d9785592e1a3413674a385ac7757857c05cb93958b7'
    
    if (!signature) {
      console.error('Missing signature header')
      return new Response('Missing signature', { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    const isValidSignature = await verifySignature(rawPayload, signature, webhookSecret)
    if (!isValidSignature) {
      console.error('Invalid signature')
      return new Response('Invalid signature', { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    console.log('Signature verified successfully')
    
    // Parse the webhook payload
    const payload: ElevenLabsConversationWebhookPayload = JSON.parse(rawPayload)
    console.log('Webhook payload:', payload)

    // Only process conversation_ended events
    if (payload.status !== 'conversation_ended') {
      console.log(`Conversation ${payload.conversation_id} status: ${payload.status}, skipping transcript processing`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Status not conversation_ended, skipping processing',
          conversation_id: payload.conversation_id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    
    if (!elevenLabsApiKey) {
      console.error('ELEVENLABS_API_KEY not found in environment')
      throw new Error('Missing ElevenLabs API key')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the case with this conversation ID
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, title, transcript, user_id')
      .eq('conversation_id', payload.conversation_id)
      .single()

    // Fetch detailed conversation data from ElevenLabs API
    const conversationDetails = await getConversationDetails(payload.conversation_id, elevenLabsApiKey)
    
    if (!conversationDetails) {
      console.error('Failed to fetch conversation details from ElevenLabs API')
      throw new Error('Failed to fetch conversation details')
    }

    // Prepare the data to update/insert
    const caseUpdateData = {
      transcript: conversationDetails.transcript,
      conversation_id: payload.conversation_id,
      updated_at: new Date().toISOString(),
      ...(conversationDetails.audio_url && { audio_file_url: conversationDetails.audio_url }),
      ...(conversationDetails.duration_seconds && { duration_seconds: conversationDetails.duration_seconds })
    }

    if (caseError || !caseData) {
      console.log(`No case found with conversation ID: ${payload.conversation_id}, creating new case`)
      
      // Generate a meaningful case title based on conversation content
      const caseTitle = conversationDetails.transcript.length > 0 
        ? `Conversation ${new Date().toLocaleDateString()} - ${conversationDetails.transcript.substring(0, 50)}...`
        : `ElevenLabs Conversation ${new Date().toISOString()}`

      // Create a new case if none exists
      const { data: newCase, error: newCaseError } = await supabase
        .from('cases')
        .insert({
          title: caseTitle,
          user_id: 'system', // You might need to handle user identification differently
          ...caseUpdateData
        })
        .select()
        .single()

      if (newCaseError) {
        console.error('Error creating new case:', newCaseError)
        throw new Error('Failed to create case')
      }

      console.log('Created new case:', newCase.id, 'with conversation data')
      
      // Store individual messages if available
      if (conversationDetails.messages && conversationDetails.messages.length > 0) {
        const messageInserts = conversationDetails.messages.map(msg => ({
          case_id: newCase.id,
          message_text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: msg.timestamp || new Date().toISOString()
        }))

        const { error: messagesError } = await supabase
          .from('case_messages')
          .insert(messageInserts)

        if (messagesError) {
          console.error('Error inserting messages:', messagesError)
        } else {
          console.log(`Inserted ${messageInserts.length} messages for new case`)
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'New case created with conversation data',
          conversation_id: payload.conversation_id,
          case_id: newCase.id,
          transcript_length: conversationDetails.transcript.length,
          audio_url: conversationDetails.audio_url,
          duration_seconds: conversationDetails.duration_seconds
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update the existing case with enhanced data
    console.log('Updating existing case with enhanced conversation data:', caseData.id)

    const { error: updateError } = await supabase
      .from('cases')
      .update(caseUpdateData)
      .eq('id', caseData.id)

    if (updateError) {
      console.error('Error updating case:', updateError)
      throw new Error('Failed to update case')
    }

    // Store/update individual messages if available
    if (conversationDetails.messages && conversationDetails.messages.length > 0) {
      // First, check if messages already exist for this case
      const { data: existingMessages } = await supabase
        .from('case_messages')
        .select('id')
        .eq('case_id', caseData.id)

      if (!existingMessages || existingMessages.length === 0) {
        // Insert new messages
        const messageInserts = conversationDetails.messages.map(msg => ({
          case_id: caseData.id,
          message_text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: msg.timestamp || new Date().toISOString()
        }))

        const { error: messagesError } = await supabase
          .from('case_messages')
          .insert(messageInserts)

        if (messagesError) {
          console.error('Error inserting messages:', messagesError)
        } else {
          console.log(`Inserted ${messageInserts.length} messages for existing case`)
        }
      }
    }

    console.log(`Successfully processed conversation completion for: ${payload.conversation_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conversation transcript and data processed and stored',
        conversation_id: payload.conversation_id,
        case_id: caseData.id,
        transcript_length: conversationDetails.transcript.length,
        audio_url: conversationDetails.audio_url,
        duration_seconds: conversationDetails.duration_seconds,
        messages_count: conversationDetails.messages?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing ElevenLabs conversation webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
