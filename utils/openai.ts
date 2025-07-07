import { OPENAI_API_KEY } from '@env';
import { SymptomLog, MedicalRecommendation, ActionItem, SymptomPattern } from '../types/recommendations';

const OPENAI_API_URL = 'https://api.openai.com/v1';

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

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Convert audio file to base64 or form data
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    // Use retry logic for transcription
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data: TranscriptionResponse = await response.json();
          return data.text;
        }

        const errorText = await response.text();
        console.error(`Transcription error (attempt ${attempt}):`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });

        // Handle rate limiting
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Transcription rate limit hit (attempt ${attempt}), waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`Transcription failed: ${response.status} ${response.statusText} - ${errorText}`);
      } catch (error) {
        if (attempt === 3) {
          throw error;
        }
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Transcription failed (attempt ${attempt}), retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Transcription failed after all retries');
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare assistant. Summarize patient symptoms in exactly 5 words or less. Focus on the main symptoms or concerns, but since the patient is reading this summary, make sure it is empathetic. If the user mentions good things as well, include that as well (not just negative things).Be concise and medical but understandable.'
        },
        {
          role: 'user',
          content: `Summarize this patient symptom description in exactly 5 words or less: "${transcript}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.3,
    };

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
};

// Helper function to analyze symptom patterns
const analyzeSymptomPatterns = (logs: SymptomLog[]): SymptomPattern[] => {
  const patterns: { [key: string]: SymptomPattern } = {};
  
  logs.forEach(log => {
    const symptoms = extractSymptomsFromTranscript(log.transcript);
    symptoms.forEach(symptom => {
      if (!patterns[symptom]) {
        patterns[symptom] = {
          symptom,
          frequency: 0,
          averageDuration: 0,
          severity: 'mild',
          trend: 'stable',
          lastOccurrence: log.timestamp,
          firstOccurrence: log.timestamp
        };
      }
      patterns[symptom].frequency++;
      patterns[symptom].lastOccurrence = log.timestamp;
    });
  });

  return Object.values(patterns);
};

// Helper function to extract symptoms from transcript
const extractSymptomsFromTranscript = (transcript: string): string[] => {
  const commonSymptoms = [
    'headache', 'fever', 'cough', 'fatigue', 'nausea', 'dizziness', 'pain',
    'stress', 'anxiety', 'depression', 'insomnia', 'back pain', 'chest pain',
    'shortness of breath', 'abdominal pain', 'diarrhea', 'constipation',
    'rash', 'swelling', 'bleeding', 'irregular period', 'missed period',
    'joint pain', 'muscle pain', 'numbness', 'tingling', 'vision problems',
    'hearing problems', 'weight loss', 'weight gain', 'loss of appetite'
  ];
  
  const foundSymptoms = commonSymptoms.filter(symptom => 
    transcript.toLowerCase().includes(symptom)
  );
  
  return foundSymptoms;
};

// Helper function to track last recommendation time (simple in-memory storage)
let lastRecommendationTimestamp = 0;
let lastDailyRecommendationDate = '';

const getLastRecommendationTime = async (): Promise<number> => {
  return lastRecommendationTimestamp;
};

const setLastRecommendationTime = async (): Promise<void> => {
  lastRecommendationTimestamp = Date.now();
};

const getLastDailyRecommendationDate = async (): Promise<string> => {
  return lastDailyRecommendationDate;
};

const setLastDailyRecommendationDate = async (): Promise<void> => {
  lastDailyRecommendationDate = new Date().toDateString();
};

// Helper function to make API request with retry logic
const makeOpenAIRequest = async (requestBody: any, maxRetries: number = 3): Promise<ChatCompletionResponse> => {
  // Add a smaller delay before each request to prevent rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text();
      console.error(`OpenAI API Error (attempt ${attempt}):`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });

      // Handle rate limiting
      if (response.status === 429) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.code === 'rate_limit_exceeded') {
            const retryAfter = errorData.error?.message?.match(/Please try again in ([\d.]+)s/)?.[1];
            const waitTime = retryAfter ? parseFloat(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
            
            console.log(`Rate limit hit (attempt ${attempt}), waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Retry
          }
        } catch (parseError) {
          console.error('Failed to parse rate limit error:', parseError);
        }
      }

      // For other errors, throw immediately
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff for other errors
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Request failed (attempt ${attempt}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Max retries exceeded');
};

export const generateRecommendations = async (symptomLogs: SymptomLog[]): Promise<MedicalRecommendation[]> => {
  try {
    // Debug: Check if API key is available
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }
    
    if (symptomLogs.length < 1) {
      return []; // Need at least 1 log to generate recommendations
    }

    // Rate limiting: Only generate recommendations every 2 minutes (reduced from 5)
    const lastRecommendationTime = await getLastRecommendationTime();
    const timeSinceLastRecommendation = Date.now() - lastRecommendationTime;
    const minInterval = 2 * 60 * 1000; // 2 minutes
    
    if (timeSinceLastRecommendation < minInterval) {
      console.log(`Skipping recommendation generation - too soon since last one (${Math.round(timeSinceLastRecommendation / 1000)}s ago)`);
      return [];
    }

    const patterns = analyzeSymptomPatterns(symptomLogs);
    const logsText = symptomLogs.map(log => 
      `Date: ${log.timestamp.toLocaleDateString()} ${log.timestamp.toLocaleTimeString()}\nSummary: ${log.summary}\nFull description: ${log.transcript}`
    ).join('\n\n');

    const patternsText = patterns.map(pattern => 
      `Symptom: ${pattern.symptom}\nFrequency: ${pattern.frequency} times\nFirst occurrence: ${pattern.firstOccurrence.toLocaleDateString()}\nLast occurrence: ${pattern.lastOccurrence.toLocaleDateString()}\nDuration: ${Math.round((pattern.lastOccurrence.getTime() - pattern.firstOccurrence.getTime()) / (1000 * 60 * 60 * 24))} days`
    ).join('\n\n');

    const prompt = `You are a caring healthcare assistant analyzing patient symptom patterns. Your role is to provide gentle, supportive recommendations that help patients take care of their health.

PATIENT SYMPTOM HISTORY:
${logsText}

SYMPTOM PATTERN ANALYSIS:
${patternsText}

GENTLE HEALTH GUIDELINES:
1. **Fever**: Consider seeing a doctor if fever lasts more than 3-5 days
2. **Headaches**: New or changing headache patterns may benefit from medical evaluation
3. **Chest Pain**: Any chest discomfort should be evaluated by a healthcare provider
4. **Shortness of Breath**: New breathing difficulties warrant medical attention
5. **Abdominal Pain**: Persistent or severe stomach pain should be checked
6. **Mental Health**: Ongoing stress or mood changes may benefit from professional support
7. **Irregular Periods**: Period changes lasting several months may need evaluation
8. **Weight Changes**: Significant unexplained weight changes should be discussed with a doctor
9. **Fatigue**: Persistent tiredness with other symptoms may need attention
10. **Pain**: New or persistent pain should be evaluated

RECOMMENDATION APPROACH:
- HIGH Priority: Important to address soon (but not necessarily urgent)
- MEDIUM Priority: Worth considering in the near future
- LOW Priority: Gentle suggestions for wellness and monitoring

For each recommendation, provide:
1. Caring, supportive explanation
2. Gentle action suggestions
3. Reassuring context
4. Optional follow-up suggestions

Focus on being supportive and helpful rather than alarming. Use encouraging, gentle language. Only suggest medical evaluation when it would be genuinely beneficial for the patient's wellbeing.

Format response as JSON array with this structure:
{
  "priority": "HIGH|MEDIUM|LOW",
  "title": "string",
  "description": "string",
  "actionItems": [
    {
      "id": "unique_id",
      "title": "string",
      "description": "string", 
      "type": "appointment|medication|exercise|diet|rest|monitoring|consultation|test",
      "isCompleted": false,
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "urgency": "immediate|within days|within weeks",
  "category": "appointment|medication|lifestyle|monitoring|emergency|preventive",
  "medicalRationale": "string",
  "symptomsTriggering": ["string"],
  "severityIndicators": ["string"],
  "followUpRequired": boolean,
  "followUpTimeline": "string"
}`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a caring healthcare assistant providing gentle, supportive health recommendations. Be encouraging and helpful rather than alarming. Use warm, supportive language and only suggest medical evaluation when it would genuinely benefit the patient. Focus on wellness and prevention.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    };

    console.log('Sending request to OpenAI:', {
      url: `${OPENAI_API_URL}/chat/completions`,
      hasApiKey: !!OPENAI_API_KEY,
      promptLength: prompt.length,
      model: requestBody.model
    });

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const recommendations = JSON.parse(content);
      const parsedRecommendations = Array.isArray(recommendations) ? recommendations : [recommendations];
      
      // Update last recommendation time
      await setLastRecommendationTime();
      
      // Add metadata to each recommendation
      return parsedRecommendations.map((rec: any, index: number) => ({
        ...rec,
        id: `rec_${Date.now()}_${index}`,
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false,
        actionItems: rec.actionItems.map((item: any, itemIndex: number) => ({
          ...item,
          id: `action_${Date.now()}_${index}_${itemIndex}`,
          isCompleted: false
        }))
      }));
    } catch (parseError) {
      console.error('Failed to parse recommendations JSON:', parseError);
      console.error('Raw response:', content);
      
      // Fallback: return a gentle monitoring recommendation
      return [{
        priority: "LOW",
        title: "Keep Up the Great Work",
        description: "You're doing a wonderful job tracking your health! Continue monitoring your symptoms to better understand your patterns.",
        actionItems: [{
          id: `action_${Date.now()}_0_0`,
          title: "Continue Your Health Journal",
          description: "Keep recording your daily symptoms and feelings",
          type: "monitoring",
          isCompleted: false,
          priority: "LOW"
        }],
        urgency: "within weeks",
        category: "monitoring",
        medicalRationale: "Regular health tracking helps you and your healthcare providers understand your patterns and make informed decisions about your care.",
        symptomsTriggering: ["ongoing monitoring"],
        severityIndicators: ["general wellness"],
        followUpRequired: false,
        id: `rec_${Date.now()}_0`,
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }];
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}; 

export const generateDailyWellnessRecommendation = async (): Promise<MedicalRecommendation[]> => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }

    // Check if we already generated a daily recommendation today
    const lastDailyDate = await getLastDailyRecommendationDate();
    const today = new Date().toDateString();
    
    if (lastDailyDate === today) {
      console.log('Daily wellness recommendation already generated today');
      return [];
    }

    const prompt = `You are a caring healthcare assistant providing daily wellness recommendations. Your role is to encourage healthy habits and preventive care.

DAILY WELLNESS GUIDELINES:
- Focus on preventive health and wellness
- Encourage healthy lifestyle habits
- Provide gentle reminders for self-care
- Suggest activities that promote mental and physical wellbeing
- Be encouraging and supportive

Generate a single, gentle daily wellness recommendation that could include:
- Hydration reminders
- Exercise suggestions
- Stress management tips
- Sleep hygiene advice
- Nutrition guidance
- Mental health support
- Preventive care reminders

Format response as JSON array with this structure:
{
  "priority": "LOW",
  "title": "string",
  "description": "string",
  "actionItems": [
    {
      "id": "unique_id",
      "title": "string",
      "description": "string", 
      "type": "exercise|diet|rest|monitoring",
      "isCompleted": false,
      "priority": "LOW"
    }
  ],
  "urgency": "within days",
  "category": "preventive",
  "medicalRationale": "string",
  "symptomsTriggering": ["daily wellness"],
  "severityIndicators": ["preventive care"],
  "followUpRequired": false,
  "followUpTimeline": "ongoing"
}`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a caring healthcare assistant providing gentle, supportive daily wellness recommendations. Be encouraging and helpful, focusing on prevention and healthy habits.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    };

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const recommendations = JSON.parse(content);
      const parsedRecommendations = Array.isArray(recommendations) ? recommendations : [recommendations];
      
      // Update last daily recommendation date
      await setLastDailyRecommendationDate();
      
      // Add metadata to each recommendation
      return parsedRecommendations.map((rec: any, index: number) => ({
        ...rec,
        id: `daily_${Date.now()}_${index}`,
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false,
        actionItems: rec.actionItems.map((item: any, itemIndex: number) => ({
          ...item,
          id: `daily_action_${Date.now()}_${index}_${itemIndex}`,
          isCompleted: false
        }))
      }));
    } catch (parseError) {
      console.error('Failed to parse daily wellness recommendations JSON:', parseError);
      
      // Fallback: return a gentle wellness recommendation
      return [{
        priority: "LOW",
        title: "Daily Wellness Reminder",
        description: "Take a moment today to check in with yourself and practice some self-care.",
        actionItems: [{
          id: `daily_action_${Date.now()}_0_0`,
          title: "Practice Self-Care",
          description: "Take 5 minutes to do something that makes you feel good",
          type: "monitoring",
          isCompleted: false,
          priority: "LOW"
        }],
        urgency: "within days",
        category: "preventive",
        medicalRationale: "Regular self-care practices support overall mental and physical wellbeing.",
        symptomsTriggering: ["daily wellness"],
        severityIndicators: ["preventive care"],
        followUpRequired: false,
        id: `daily_${Date.now()}_0`,
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false
      }];
    }
  } catch (error) {
    console.error('Error generating daily wellness recommendations:', error);
    throw error;
  }
}; 