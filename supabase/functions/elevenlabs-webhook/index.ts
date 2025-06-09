
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ElevenLabsWebhookPayload {
  project_id: string
  request_id: string
  input_text: string
  output_audio_url: string
  status: string
  created_at: string
  character_count: number
  voice_id: string
  model_id: string
  voice_settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
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
    console.log('ElevenLabs webhook received')
    
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
    const payload: ElevenLabsWebhookPayload = JSON.parse(rawPayload)
    console.log('Webhook payload:', payload)

    // Only process completed requests
    if (payload.status !== 'completed') {
      console.log(`Request ${payload.request_id} status: ${payload.status}, skipping`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Status not completed, skipping processing',
          request_id: payload.request_id 
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the most recent case or create a new one
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let caseId: string

    if (caseError || !caseData) {
      console.log('No recent case found, creating new case')
      // Create a new case
      const { data: newCase, error: newCaseError } = await supabase
        .from('cases')
        .insert({
          title: `ElevenLabs TTS ${new Date().toISOString()}`,
          transcript: payload.input_text,
          audio_file_url: payload.output_audio_url,
          user_id: 'system' // You might need to handle user identification differently
        })
        .select()
        .single()

      if (newCaseError) {
        console.error('Error creating new case:', newCaseError)
        throw new Error('Failed to create case')
      }

      caseId = newCase.id
      console.log('Created new case:', caseId)
    } else {
      // Update the existing case with the TTS data
      caseId = caseData.id
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          transcript: payload.input_text,
          audio_file_url: payload.output_audio_url
        })
        .eq('id', caseId)

      if (updateError) {
        console.error('Error updating case:', updateError)
        throw new Error('Failed to update case')
      }

      console.log('Updated case:', caseId)
    }

    // Log the webhook event for debugging
    console.log(`Successfully processed ElevenLabs webhook for request: ${payload.request_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'TTS request processed and stored',
        request_id: payload.request_id,
        case_id: caseId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing ElevenLabs webhook:', error)
    
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
