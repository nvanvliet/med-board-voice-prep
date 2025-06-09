
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

// Fetch conversation transcript from ElevenLabs API
async function getConversationTranscript(conversationId: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`Fetching transcript for conversation: ${conversationId}`)
    
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
    console.log('Conversation data received:', conversationData)
    
    // Extract transcript from conversation data
    if (conversationData.transcript) {
      return conversationData.transcript
    }
    
    // If transcript is in messages format, concatenate them
    if (conversationData.messages && Array.isArray(conversationData.messages)) {
      const transcript = conversationData.messages
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n')
      return transcript
    }
    
    return null
  } catch (error) {
    console.error('Error fetching conversation transcript:', error)
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
      .select('id, title, transcript')
      .eq('conversation_id', payload.conversation_id)
      .single()

    if (caseError || !caseData) {
      console.log(`No case found with conversation ID: ${payload.conversation_id}`)
      
      // Create a new case if none exists
      const { data: newCase, error: newCaseError } = await supabase
        .from('cases')
        .insert({
          title: `ElevenLabs Conversation ${new Date().toISOString()}`,
          conversation_id: payload.conversation_id,
          transcript: payload.transcript || '',
          user_id: 'system' // You might need to handle user identification differently
        })
        .select()
        .single()

      if (newCaseError) {
        console.error('Error creating new case:', newCaseError)
        throw new Error('Failed to create case')
      }

      console.log('Created new case:', newCase.id)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'New case created with conversation data',
          conversation_id: payload.conversation_id,
          case_id: newCase.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch the full transcript from ElevenLabs API
    const fullTranscript = await getConversationTranscript(payload.conversation_id, elevenLabsApiKey)
    
    // Use the fetched transcript or fallback to payload transcript
    const transcriptToSave = fullTranscript || payload.transcript || caseData.transcript || ''
    
    console.log('Updating case with transcript length:', transcriptToSave.length)

    // Update the existing case with the final transcript
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        transcript: transcriptToSave,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseData.id)

    if (updateError) {
      console.error('Error updating case:', updateError)
      throw new Error('Failed to update case')
    }

    console.log(`Successfully processed conversation completion for: ${payload.conversation_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conversation transcript processed and stored',
        conversation_id: payload.conversation_id,
        case_id: caseData.id,
        transcript_length: transcriptToSave.length
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
