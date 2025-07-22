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
          content: 'You are a comprehensive healthcare assistant. Summarize patient health concerns in exactly 5 words or less. Focus on the main health issue (symptoms, injuries, mental health, stress, etc.), but since the patient is reading this summary, make sure it is empathetic. If the user mentions good things as well, include that as well (not just negative things). Be concise and medical but understandable.'
        },
        {
          role: 'user',
          content: `Summarize this patient health concern description in exactly 5 words or less: "${transcript}"`
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
  const negativeHealthKeywords = [
    // Pain and discomfort
    'pain', 'ache', 'hurt', 'sore', 'uncomfortable', 'sick', 'ill', 'fever',
    'headache', 'migraine', 'dizzy', 'nausea', 'vomiting', 'diarrhea', 'constipation',
    'cough', 'sneeze', 'runny nose', 'congestion', 'shortness of breath', 'wheezing',
    'chest pain', 'heart palpitation', 'irregular heartbeat', 'high blood pressure',
    'abdominal pain', 'stomach ache', 'bloating', 'gas', 'acid reflux', 'heartburn',
    'rash', 'itch', 'swelling', 'bruise', 'cut', 'bleeding', 'infection',
    'fatigue', 'tired', 'exhausted', 'weak', 'lightheaded', 'fainting',
    'anxiety', 'panic', 'depression', 'sad', 'hopeless', 'stress', 'overwhelmed',
    'insomnia', 'can\'t sleep', 'sleep problems', 'nightmares', 'night sweats',
    'weight loss', 'weight gain', 'loss of appetite', 'increased appetite',
    'thirst', 'frequent urination', 'irregular period', 'missed period',
    'joint pain', 'muscle pain', 'back pain', 'neck pain', 'shoulder pain',
    'numbness', 'tingling', 'weakness', 'paralysis', 'seizure', 'tremor',
    'vision problems', 'blurred vision', 'double vision', 'eye pain',
    'hearing problems', 'ringing in ears', 'ear pain', 'ear infection',
    'dental pain', 'toothache', 'gum problems', 'mouth sores',
    'skin problems', 'acne', 'eczema', 'psoriasis', 'mole changes',
    'lump', 'bump', 'growth', 'tumor', 'cancer', 'cancerous',
    
    // Injuries and trauma
    'injury', 'injured', 'sprain', 'strain', 'fracture', 'broken', 'dislocation',
    'concussion', 'whiplash', 'burn', 'scald', 'frostbite', 'heat stroke',
    'dehydration', 'sunburn', 'blister', 'callus', 'corn', 'bunion',
    
    // Bug bites and stings
    'bug bite', 'insect bite', 'mosquito bite', 'tick bite', 'bee sting', 'wasp sting',
    'spider bite', 'snake bite', 'allergic reaction', 'anaphylaxis', 'hives',
    
    // Mental health and emotional
    'mental health', 'emotional', 'mood', 'irritable', 'angry', 'frustrated',
    'lonely', 'isolated', 'grief', 'loss', 'trauma', 'ptsd', 'ocd', 'adhd',
    'bipolar', 'manic', 'suicidal', 'self-harm', 'eating disorder', 'body image',
    
    // Physical symptoms and conditions
    'allergy', 'asthma', 'diabetes', 'hypertension', 'arthritis', 'fibromyalgia',
    'migraine', 'cluster headache', 'tension headache', 'sinus', 'bronchitis',
    'pneumonia', 'flu', 'cold', 'covid', 'mono', 'strep throat', 'tonsillitis',
    'appendicitis', 'gallbladder', 'kidney stone', 'uti', 'bladder infection',
    'yeast infection', 'std', 'sti', 'pregnancy', 'miscarriage', 'menopause',
    
    // Lifestyle and wellness concerns
    'poor sleep', 'sleep deprived', 'jet lag', 'circadian rhythm', 'work stress',
    'burnout', 'work-life balance', 'relationship stress', 'family stress',
    'financial stress', 'caregiver stress', 'postpartum', 'baby blues',
    'exercise injury', 'sports injury', 'workout pain', 'muscle soreness',
    'stiffness', 'limited mobility', 'balance problems', 'coordination issues',
    
    // Environmental and occupational
    'workplace injury', 'ergonomic', 'repetitive strain', 'carpal tunnel',
    'eye strain', 'computer vision', 'back strain', 'lifting injury',
    'chemical exposure', 'allergen', 'mold', 'dust', 'pollen', 'pet allergy',
    'food allergy', 'food poisoning', 'intolerance', 'celiac', 'gluten',
    
    // Chronic conditions and management
    'chronic pain', 'flare up', 'exacerbation', 'remission', 'relapse',
    'medication side effect', 'drug interaction', 'withdrawal', 'addiction',
    'substance abuse', 'alcohol', 'smoking', 'vaping', 'nicotine',
    
    // Preventive and monitoring
    'check up', 'screening', 'preventive', 'vaccination', 'immunization',
    'blood pressure', 'cholesterol', 'blood sugar', 'heart rate', 'pulse',
    'temperature', 'oxygen', 'saturation', 'respiratory rate'
  ];

  const positiveKeywords = [
    'good', 'great', 'excellent', 'healthy', 'fine', 'well', 'better', 'improved',
    'feeling good', 'feeling great', 'no problems', 'no issues', 'no symptoms',
    'normal', 'usual', 'routine', 'stable', 'recovered', 'healed'
  ];

  const transcriptLower = transcript.toLowerCase();
  
  // Check for negative health keywords
  const hasNegativeSymptoms = negativeHealthKeywords.some(keyword => transcriptLower.includes(keyword));
  
  // Check for positive keywords that might indicate no health concerns
  const hasPositiveIndicators = positiveKeywords.some(keyword => transcriptLower.includes(keyword));
  
  // Only return true if there are negative symptoms AND no strong positive indicators
  return hasNegativeSymptoms && !hasPositiveIndicators;
};

// Check if a recommendation already exists for a specific symptom
const hasExistingRecommendation = (symptom: string, existingRecommendations: MedicalRecommendation[]): boolean => {
  return existingRecommendations.some(rec => 
    rec.symptomsTriggering.some(trigger => 
      trigger.toLowerCase().includes(symptom.toLowerCase())
    ) && !rec.isCompleted && !rec.isCancelled
  );
};

// Check if a symptom needs follow-up (mentioned but not resolved)
const needsFollowUp = (symptom: string, symptomLogs: SymptomLog[]): boolean => {
  const symptomLogsWithSymptom = symptomLogs.filter(log => 
    log.transcript.toLowerCase().includes(symptom.toLowerCase())
  );
  
  if (symptomLogsWithSymptom.length < 2) return false; // Need at least 2 mentions
  
  const firstMention = symptomLogsWithSymptom[symptomLogsWithSymptom.length - 1]; // Oldest
  const lastMention = symptomLogsWithSymptom[0]; // Newest
  
  const daysBetween = Math.round((lastMention.timestamp.getTime() - firstMention.timestamp.getTime()) / (1000 * 60 * 60 * 24));
  
  // If symptom was mentioned more than 1 day ago and hasn't been resolved, it needs follow-up
  return daysBetween > 1;
};

// Generate follow-up questions for unresolved symptoms
export const generateFollowUpQuestions = async (symptomLogs: SymptomLog[]): Promise<string[]> => {
  try {
    if (!OPENAI_API_KEY) {
      return [];
    }
    
    if (symptomLogs.length < 2) {
      return [];
    }
    
    const patterns = analyzeSymptomPatterns(symptomLogs);
    const unresolvedSymptoms = patterns.filter(pattern => 
      needsFollowUp(pattern.symptom, symptomLogs)
    );
    
    if (unresolvedSymptoms.length === 0) {
      return [];
    }
    
    const primarySymptom = unresolvedSymptoms[0];
    const symptomLogsWithSymptom = symptomLogs.filter(log => 
      log.transcript.toLowerCase().includes(primarySymptom.symptom.toLowerCase())
    );
    
    const logsText = symptomLogsWithSymptom.slice(0, 3).map(log => 
      `Date: ${log.timestamp.toLocaleDateString()}\nSummary: ${log.summary}\nDescription: ${log.transcript}`
    ).join('\n\n');
    
    const prompt = `A patient mentioned "${primarySymptom.symptom}" but hasn't provided an update. Generate a gentle, supportive follow-up question to check if they're still experiencing this health concern.

HEALTH HISTORY:
${logsText}

GENERATE ONE FOLLOW-UP QUESTION that:
1. Is gentle and supportive, not pushy
2. Asks if they're still experiencing the health concern
3. Offers to help if they need it
4. Uses warm, caring language
5. Is appropriate for the type of health concern (physical, mental, injury, etc.)

Format as a simple string, no JSON.`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a caring healthcare assistant covering all health concerns. Generate gentle follow-up questions to check on unresolved health issues. Be supportive and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    };

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return [];
    }
    
    return [content.trim()];
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [];
  }
};

// Check for missed periods (women's health tracking)
export const checkForMissedPeriod = async (symptomLogs: SymptomLog[]): Promise<string | null> => {
  try {
    if (!OPENAI_API_KEY) {
      return null;
    }
    
    const periodLogs = symptomLogs.filter(log => 
      log.transcript.toLowerCase().includes('period') || 
      log.transcript.toLowerCase().includes('menstrual')
    );
    
    if (periodLogs.length === 0) {
      return null;
    }
    
    const lastPeriodLog = periodLogs[0]; // Most recent
    const daysSinceLastPeriod = Math.round((Date.now() - lastPeriodLog.timestamp.getTime()) / (1000 * 60 * 60 * 24));
    
    // If it's been more than 35 days since last period mention, check if they missed it
    if (daysSinceLastPeriod > 35) {
      const prompt = `A patient mentioned their period ${daysSinceLastPeriod} days ago but hasn't mentioned it since. Generate a gentle question to check if they've had their period since then or if they forgot to mention it.

Generate ONE gentle question that:
1. Is supportive and not alarming
2. Asks if they've had their period since the last mention
3. Offers to help track it if needed
4. Uses caring, non-judgmental language

Format as a simple string, no JSON.`;

      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a caring healthcare assistant. Generate gentle questions about menstrual health tracking. Be supportive and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      };

      const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        return content.trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for missed period:', error);
    return null;
  }
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

    const prompt = `You are a comprehensive healthcare assistant. A patient has reported a health concern that may need attention.

PRIMARY HEALTH CONCERN: ${primarySymptom.symptom}
FREQUENCY: ${primarySymptom.frequency} times
FIRST OCCURRENCE: ${primarySymptom.firstOccurrence.toLocaleDateString()}
LAST OCCURRENCE: ${primarySymptom.lastOccurrence.toLocaleDateString()}

RECENT HEALTH HISTORY:
${logsText}

CRITICAL REQUIREMENTS:
1. Generate ONE supportive recommendation for "${primarySymptom.symptom}"
2. Be helpful and informative, not alarming
3. Focus on practical steps to address this specific health concern
4. Provide clear, actionable guidance
5. Only suggest medical evaluation if genuinely beneficial

TONE GUIDELINES:
- Be supportive and informative, not scary
- Use reassuring language while being realistic
- Focus on practical solutions
- Avoid medical jargon unless necessary

COMPREHENSIVE HEALTH APPROACH:
- **Physical Injuries**: Consider severity, mobility impact, when to seek care
- **Bug Bites/Stings**: Consider allergic reactions, infection risk, when to worry
- **Mental Health**: Consider impact on daily life, when to seek support
- **Stress/Burnout**: Consider work-life balance, coping strategies, professional help
- **Chronic Pain**: Consider triggers, management strategies, quality of life
- **Sleep Issues**: Consider sleep hygiene, underlying causes, when to investigate
- **Digestive Issues**: Consider diet, stress, when to see specialist
- **Respiratory**: Consider severity, triggers, when to seek immediate care
- **Skin Issues**: Consider infection risk, allergic reactions, when to see dermatologist
- **Women's Health**: Consider hormonal factors, reproductive health, when to see OBGYN
- **Men's Health**: Consider age-appropriate screenings, when to see urologist
- **Pediatric**: Consider age-appropriate concerns, growth, development
- **Geriatric**: Consider age-related changes, medication interactions, fall risk
- **Occupational**: Consider workplace safety, ergonomics, workers' comp
- **Environmental**: Consider allergen exposure, chemical sensitivity, air quality
- **Lifestyle**: Consider exercise, diet, stress management, preventive care

Format response as a SINGLE JSON object:
{
  "priority": "HIGH|MEDIUM|LOW",
  "title": "Supportive title for ${primarySymptom.symptom}",
  "description": "Clear, helpful explanation about this symptom",
  "actionItems": [
    {
      "id": "unique_id",
      "title": "Practical action for this symptom",
      "description": "Clear, helpful description", 
      "type": "appointment|medication|exercise|diet|rest|monitoring|consultation|test",
      "isCompleted": false,
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "urgency": "immediate|within days|within weeks",
  "category": "appointment|medication|lifestyle|monitoring|emergency",
  "medicalRationale": "Clear explanation of why this helps",
  "symptomsTriggering": ["${primarySymptom.symptom}"],
  "severityIndicators": ["specific indicators for this symptom"],
  "followUpRequired": boolean,
  "followUpTimeline": "when to follow up"
}`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a comprehensive healthcare assistant covering all health concerns - physical, mental, emotional, occupational, environmental, and lifestyle. Generate ONE specific, actionable recommendation for the primary health concern. Be direct and avoid generic wellness advice. Only suggest medical evaluation when genuinely needed for the specific health concern.'
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

// Generate personalized appointment questions based on symptoms and appointment type
export const generateAppointmentQuestions = async (
  appointmentTitle: string,
  symptoms: any[],
  appointmentDate: Date
): Promise<string[]> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // If no symptoms, generate general annual appointment questions
    if (symptoms.length === 0) {
      const prompt = `Generate 5-6 specific questions for a general annual checkup that patients commonly forget to ask. Focus on questions about:

1. Lab results and blood pressure trends
2. Vaccination status and recommendations
3. Medication and supplement reviews
4. Preventive screenings based on age/risk factors
5. Lifestyle changes with biggest health impact
6. Mental health and stress management
7. Sleep quality and patterns
8. Work-related health concerns
9. Environmental health factors
10. Chronic condition management

Make questions specific and actionable, not generic. Format as a JSON array of strings.`;

      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a healthcare assistant. Generate specific, actionable questions for annual checkups that patients commonly forget to ask.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      };

      const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          const questions = JSON.parse(content);
          return Array.isArray(questions) ? questions : [];
        } catch (parseError) {
          console.error('Failed to parse questions JSON:', parseError);
          return [];
        }
      }
      return [];
    }

    // For health visits with concerns, generate highly specific questions
    const symptomsText = symptoms.map(s => 
      `Date: ${s.timestamp.toLocaleDateString()}\nSummary: ${s.summary}\nDetails: ${s.transcript}`
    ).join('\n\n');

    const prompt = `Generate 6-8 highly specific questions for a medical appointment based on the patient's health concerns. These should be questions that patients commonly FORGET to ask but are crucial for their specific situation.

PATIENT HEALTH CONCERNS:
${symptomsText}

APPOINTMENT: ${appointmentTitle}
APPOINTMENT DATE: ${appointmentDate.toLocaleDateString()}

REQUIREMENTS:
1. Questions must reference the patient's SPECIFIC health concerns
2. Focus on historically forgotten questions (not obvious ones)
3. Include practical concerns about work, daily activities, medication management
4. Ask about specific timelines, side effects, and follow-up needs
5. Consider the patient's unique situation and health concerns
6. Cover all types of health issues: physical, mental, emotional, occupational, environmental

EXAMPLES OF GOOD QUESTIONS:
- "Given my [specific health concern], could this affect my ability to [specific activity]?"
- "With my [health concern pattern], what should I do if I miss a dose of medication?"
- "How long should I expect [specific health concern] to last, and when should I worry?"
- "Could my [work stress/mental health] be contributing to my [physical symptoms]?"
- "What environmental factors should I consider with my [allergies/sensitivities]?"

EXAMPLES OF BAD QUESTIONS:
- "What are my symptoms?" (too generic)
- "Should I take medication?" (obvious)
- "What tests do I need?" (too broad)

Generate questions that are:
- Specific to the patient's health concerns
- Focused on practical daily life impact
- About things patients commonly forget to ask
- Actionable and time-sensitive
- Comprehensive (physical, mental, environmental, occupational)

Format as a JSON array of strings.`;

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a comprehensive healthcare assistant. Generate highly specific, personalized questions for medical appointments based on the patient\'s actual health concerns. Focus on questions patients commonly forget to ask, covering all health aspects.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 800,
    };

    const data: ChatCompletionResponse = await makeOpenAIRequest(requestBody);
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      try {
        const questions = JSON.parse(content);
        return Array.isArray(questions) ? questions : [];
      } catch (parseError) {
        console.error('Failed to parse questions JSON:', parseError);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error generating appointment questions:', error);
    return [];
  }
}; 