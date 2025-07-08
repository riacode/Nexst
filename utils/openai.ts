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

const getLastRecommendationTime = async (): Promise<number> => {
  return lastRecommendationTimestamp;
};

const setLastRecommendationTime = async (): Promise<void> => {
  lastRecommendationTimestamp = Date.now();
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
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit (attempt ${attempt}), waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Request failed (attempt ${attempt}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('API request failed after all retries');
};

// Check if transcript contains actual health concerns
const hasHealthConcerns = (transcript: string): boolean => {
  const healthKeywords = [
    'pain', 'ache', 'hurt', 'sore', 'uncomfortable', 'sick', 'ill', 'fever',
    'headache', 'migraine', 'dizzy', 'nausea', 'vomiting', 'diarrhea', 'constipation',
    'cough', 'sneeze', 'runny nose', 'congestion', 'shortness of breath', 'wheezing',
    'chest pain', 'heart palpitation', 'irregular heartbeat', 'high blood pressure',
    'abdominal pain', 'stomach ache', 'bloating', 'gas', 'acid reflux', 'heartburn',
    'rash', 'itch', 'swelling', 'bruise', 'cut', 'bleeding', 'infection',
    'fatigue', 'tired', 'exhausted', 'weak', 'dizzy', 'lightheaded', 'fainting',
    'anxiety', 'panic', 'depression', 'sad', 'hopeless', 'stress', 'overwhelmed',
    'insomnia', 'can\'t sleep', 'sleep problems', 'nightmares', 'night sweats',
    'weight loss', 'weight gain', 'loss of appetite', 'increased appetite',
    'thirst', 'frequent urination', 'irregular period', 'missed period', 'pregnancy',
    'joint pain', 'muscle pain', 'back pain', 'neck pain', 'shoulder pain',
    'numbness', 'tingling', 'weakness', 'paralysis', 'seizure', 'tremor',
    'vision problems', 'blurred vision', 'double vision', 'eye pain',
    'hearing problems', 'ringing in ears', 'ear pain', 'ear infection',
    'dental pain', 'toothache', 'gum problems', 'mouth sores',
    'skin problems', 'acne', 'eczema', 'psoriasis', 'mole changes',
    'lump', 'bump', 'growth', 'tumor', 'cancer', 'cancerous'
  ];

  const transcriptLower = transcript.toLowerCase();
  return healthKeywords.some(keyword => transcriptLower.includes(keyword));
};

// Check if a recommendation already exists for a specific symptom
const hasExistingRecommendation = (symptom: string, existingRecommendations: MedicalRecommendation[]): boolean => {
  return existingRecommendations.some(rec => 
    rec.symptomsTriggering.some(trigger => 
      trigger.toLowerCase().includes(symptom.toLowerCase())
    ) && !rec.isCompleted && !rec.isCancelled
  );
};

export const generateRecommendations = async (
  symptomLogs: SymptomLog[], 
  existingRecommendations: MedicalRecommendation[] = []
): Promise<MedicalRecommendation[]> => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }
    
    if (symptomLogs.length < 1) {
      return []; // Need at least 1 log to generate recommendations
    }

    // Rate limiting: Only generate recommendations every 5 minutes
    const lastRecommendationTime = await getLastRecommendationTime();
    const timeSinceLastRecommendation = Date.now() - lastRecommendationTime;
    const minInterval = 5 * 60 * 1000; // 5 minutes
    
    if (timeSinceLastRecommendation < minInterval) {
      console.log(`Skipping recommendation generation - too soon since last one (${Math.round(timeSinceLastRecommendation / 1000)}s ago)`);
      return [];
    }

    // Get the most recent symptom log
    const latestLog = symptomLogs[0]; // Assuming logs are sorted by newest first
    
    // Check if the latest log contains actual health concerns
    if (!hasHealthConcerns(latestLog.transcript)) {
      console.log('No health concerns detected in latest symptom log - skipping recommendation generation');
      return [];
    }

    const patterns = analyzeSymptomPatterns(symptomLogs);
    
    // Filter out symptoms that already have active recommendations
    const newSymptoms = patterns.filter(pattern => 
      !hasExistingRecommendation(pattern.symptom, existingRecommendations)
    );

    if (newSymptoms.length === 0) {
      console.log('All detected symptoms already have active recommendations');
      return [];
    }

    // Focus on the most recent symptom that needs attention
    const primarySymptom = newSymptoms[0];
    
    const logsText = symptomLogs.slice(0, 3).map(log => 
      `Date: ${log.timestamp.toLocaleDateString()} ${log.timestamp.toLocaleTimeString()}\nSummary: ${log.summary}\nFull description: ${log.transcript}`
    ).join('\n\n');

    const prompt = `You are a focused healthcare assistant. A patient has reported a specific health concern that requires attention.

PRIMARY SYMPTOM: ${primarySymptom.symptom}
FREQUENCY: ${primarySymptom.frequency} times
FIRST OCCURRENCE: ${primarySymptom.firstOccurrence.toLocaleDateString()}
LAST OCCURRENCE: ${primarySymptom.lastOccurrence.toLocaleDateString()}

RECENT SYMPTOM HISTORY:
${logsText}

CRITICAL REQUIREMENTS:
1. Generate ONLY ONE recommendation specifically for "${primarySymptom.symptom}"
2. Be direct and actionable - no generic wellness advice
3. Focus on the specific symptom and its severity
4. Provide clear, specific action items
5. Only suggest medical evaluation if genuinely needed for this symptom

SYMPTOM-SPECIFIC GUIDELINES:
- **Headache**: Consider triggers, duration, severity, associated symptoms
- **Chest Pain**: Always evaluate for cardiac concerns
- **Fever**: Consider duration, temperature, associated symptoms
- **Abdominal Pain**: Consider location, severity, associated symptoms
- **Mental Health**: Consider severity, duration, impact on daily life
- **Fatigue**: Consider duration, associated symptoms, impact on function

Format response as a SINGLE JSON object (not array) with this structure:
{
  "priority": "HIGH|MEDIUM|LOW",
  "title": "Specific title for ${primarySymptom.symptom}",
  "description": "Direct, specific explanation about this symptom",
  "actionItems": [
    {
      "id": "unique_id",
      "title": "Specific action for this symptom",
      "description": "Clear, actionable description", 
      "type": "appointment|medication|exercise|diet|rest|monitoring|consultation|test",
      "isCompleted": false,
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "urgency": "immediate|within days|within weeks",
  "category": "appointment|medication|lifestyle|monitoring|emergency",
  "medicalRationale": "Specific medical reasoning for this symptom",
  "symptomsTriggering": ["${primarySymptom.symptom}"],
  "severityIndicators": ["specific indicators for this symptom"],
  "followUpRequired": boolean,
  "followUpTimeline": "specific timeline for this symptom"
}`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a focused healthcare assistant. Generate ONE specific, actionable recommendation for the primary symptom. Be direct and avoid generic wellness advice. Only suggest medical evaluation when genuinely needed for the specific symptom.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
    };

    console.log('Generating symptom-specific recommendation for:', primarySymptom.symptom);

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const recommendation = JSON.parse(content);
      
      // Update last recommendation time
      await setLastRecommendationTime();
      
      // Add metadata to the recommendation
      return [{
        ...recommendation,
        id: `rec_${Date.now()}_${primarySymptom.symptom}`,
        createdAt: new Date(),
        isCompleted: false,
        isCancelled: false,
        actionItems: recommendation.actionItems.map((item: any, itemIndex: number) => ({
          ...item,
          id: `action_${Date.now()}_${primarySymptom.symptom}_${itemIndex}`,
          isCompleted: false
        }))
      }];
    } catch (parseError) {
      console.error('Failed to parse recommendation JSON:', parseError);
      console.error('Raw response:', content);
      return [];
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}; 