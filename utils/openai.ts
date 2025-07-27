import { OPENAI_API_KEY } from '@env';

// ============================================================================
// OPENAI API UTILS - PURE API FUNCTIONS ONLY
// ============================================================================
// 
// PURPOSE: Raw OpenAI API calls - no business logic
// FUNCTIONS: transcribeAudio, generateSummary, makeOpenAIRequest
// USAGE: Called by AgentOrchestrator for reactive AI tasks

interface TranscriptionResponse {
  text: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ============================================================================
// AUDIO TRANSCRIPTION
// ============================================================================

/**
 * Transcribe audio to text using OpenAI Whisper API
 * COST: $0.006 per minute of audio
 * USAGE: Called by AgentOrchestrator.processSymptomLog()
 */
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set');
  }

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data: TranscriptionResponse = await response.json();
    return data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// ============================================================================
// TEXT SUMMARIZATION
// ============================================================================

/**
 * Generate a concise summary of text using GPT-4
 * COST: $0.02 per summary
 * USAGE: Called by AgentOrchestrator.processSymptomLog()
 */
export const generateSummary = async (transcript: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set');
  }

  try {
    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a health assistant. Summarize the user\'s health concerns in 5 words or less. Be concise and specific.'
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    };

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
};

// ============================================================================
// CORE OPENAI REQUEST FUNCTION
// ============================================================================

/**
 * Make a request to OpenAI API with retry logic
 * COST: Varies by model and tokens
 * USAGE: Used by transcribeAudio, generateSummary, and agents
 */
export const makeOpenAIRequest = async (requestBody: any, maxRetries: number = 3): Promise<ChatCompletionResponse> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429 && attempt < maxRetries) {
          // Rate limit - wait and retry
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit (attempt ${attempt}), waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(`OpenAI API Error (attempt ${attempt}): ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Request failed (attempt ${attempt}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('All retry attempts failed');
}; 