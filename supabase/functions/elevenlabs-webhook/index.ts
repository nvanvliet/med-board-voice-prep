
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ElevenLabsWebhookPayload {
  conversation_id: string
  agent_id: string
  transcript: string
  duration_ms: number
  created_at: string
  user_id?: string
  metadata?: any
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
    
    // Parse the webhook payload
    const payload: ElevenLabsWebhookPayload = await req.json()
    console.log('Webhook payload:', payload)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store the transcript in the database
    // You can modify this logic based on how you want to associate the transcript with a case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (caseError) {
      console.error('Error finding recent case:', caseError)
      // Create a new case if none found
      const { data: newCase, error: newCaseError } = await supabase
        .from('cases')
        .insert({
          title: `ElevenLabs Call ${new Date().toISOString()}`,
          transcript: payload.transcript,
          duration_seconds: Math.floor(payload.duration_ms / 1000),
          user_id: payload.user_id || 'system' // You might need to handle user identification
        })
        .select()
        .single()

      if (newCaseError) {
        console.error('Error creating new case:', newCaseError)
        throw new Error('Failed to create case')
      }

      console.log('Created new case:', newCase.id)
    } else {
      // Update the existing case with the transcript
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          transcript: payload.transcript,
          duration_seconds: Math.floor(payload.duration_ms / 1000)
        })
        .eq('id', caseData.id)

      if (updateError) {
        console.error('Error updating case:', updateError)
        throw new Error('Failed to update case')
      }

      console.log('Updated case:', caseData.id)
    }

    // Log the webhook event for debugging
    console.log(`Successfully processed ElevenLabs webhook for conversation: ${payload.conversation_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transcript received and stored',
        conversation_id: payload.conversation_id 
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
