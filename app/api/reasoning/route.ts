import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Function to generate a simple reasoning for short queries
function generateSimpleReasoning(query: string): string {
  const platforms = [];
  if (query.toLowerCase().includes('tiktok')) platforms.push('TikTok');
  if (query.toLowerCase().includes('instagram') || query.toLowerCase().includes('insta')) platforms.push('Instagram');

  const topics = [];
  if (query.toLowerCase().includes('kosmetik') || query.toLowerCase().includes('beauty')) topics.push('Beauty/Kosmetik');
  if (query.toLowerCase().includes('mode') || query.toLowerCase().includes('fashion')) topics.push('Mode/Fashion');
  if (query.toLowerCase().includes('reise') || query.toLowerCase().includes('travel')) topics.push('Reise');
  if (query.toLowerCase().includes('sport') || query.toLowerCase().includes('fitness')) topics.push('Sport/Fitness');
  if (query.toLowerCase().includes('food') || query.toLowerCase().includes('essen') || query.toLowerCase().includes('kochen')) topics.push('Food/Essen');

  const demographics = [];
  if (query.toLowerCase().includes('frauen') || query.toLowerCase().includes('weiblich')) demographics.push('Weiblich');
  if (query.toLowerCase().includes('männer') || query.toLowerCase().includes('männlich')) demographics.push('Männlich');
  if (query.toLowerCase().includes('unter 30') || query.toLowerCase().includes('<30') || query.toLowerCase().includes('jung')) demographics.push('Unter 30 Jahre');

  let reasoning = "1. Verständnis der Anfrage\n\n";
  reasoning += `Die Suchanfrage "${query}" wird analysiert, um passende Creator zu finden.\n\n`;

  if (platforms.length > 0) {
    reasoning += `Plattformen: ${platforms.join(', ')}\n`;
  }

  if (topics.length > 0) {
    reasoning += `Themen: ${topics.join(', ')}\n`;
  }

  if (demographics.length > 0) {
    reasoning += `Zielgruppe: ${demographics.join(', ')}\n`;
  }

  reasoning += "\n2. Datenbankabfrage\n\n";
  reasoning += "Die Datenbank wird nach Creators durchsucht, die den Kriterien entsprechen.\n\n";

  reasoning += "3. Filterung und Priorisierung\n\n";
  reasoning += "Die Ergebnisse werden nach Relevanz und Qualität sortiert, um die besten Matches zu finden.";

  return reasoning;
}

export async function POST(req: Request) {
  // Extract request ID from headers for better logging
  const requestId = req.headers.get('x-request-id') || Date.now().toString();
  console.log(`[${requestId}] Reasoning API called`);

  // Declare query variable outside try block so it's accessible in catch block
  let query: string | undefined;

  try {
    // Check if request body is valid
    let reqBody;

    try {
      reqBody = await req.json();
      query = reqBody.query;
      console.log(`[${requestId}] Reasoning request for query:`, query);

      if (!query || typeof query !== 'string') {
        console.error(`[${requestId}] Invalid query parameter:`, query);
        throw new Error('Invalid query parameter');
      }
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: 'Could not parse request body',
        requestId: requestId
      }, { status: 400 });
    }

    // Check if API key is available - if not, use fallback
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(`[${requestId}] OPENROUTER_API_KEY is not defined, using fallback reasoning`);
      const fallbackReasoning = generateSimpleReasoning(query);

      return NextResponse.json({
        success: true,
        reasoning: fallbackReasoning,
        source: 'fallback',
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[${requestId}] Making OpenRouter API call...`);

    // Generate a simple reasoning if query is very short (for faster response)
    if (query.length < 10) {
      console.log(`[${requestId}] Query is very short, generating simple reasoning`);
      const simpleReasoning = generateSimpleReasoning(query);

      return NextResponse.json({
        success: true,
        reasoning: simpleReasoning,
        source: 'local',
        requestId: requestId
      });
    }

    // OpenRouter API call
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ugc-vz.vercel.app',
        'X-Title': 'UGC VZ Creator Search',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Experte für Influencer-Marketing. Analysiere die Suchanfrage und erkläre, wie du die passenden Creator findest. Strukturiere deine Antwort in Abschnitte: 1. Verständnis der Anfrage, 2. Datenbankabfrage, 3. Filterung und Priorisierung. Antworte auf Deutsch.'
          },
          {
            role: 'user',
            content: `Analysiere diese Suchanfrage für Creator: "${query}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    console.log(`[${requestId}] OpenRouter API response status:`, response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error(`[${requestId}] OpenRouter API error:`, errorData);
      } catch (e) {
        console.error(`[${requestId}] Failed to parse error response:`, e);
      }
      throw new Error(`Failed to get reasoning from OpenRouter: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[${requestId}] OpenRouter response received successfully`);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`[${requestId}] Unexpected OpenRouter response format:`, data);
      throw new Error('Invalid response format from OpenRouter');
    }

    const reasoning = data.choices[0].message.content;
    console.log(`[${requestId}] Reasoning content length:`, reasoning.length);

    return NextResponse.json({
      success: true,
      reasoning: reasoning,
      source: 'openrouter',
      requestId: requestId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[${requestId}] Reasoning generation error:`, error);

    // If OpenRouter fails, generate a simple reasoning as fallback
    try {
      console.log(`[${requestId}] Generating fallback reasoning`);
      // Make sure query is defined before using it
      if (typeof query === 'string') {
        const fallbackReasoning = generateSimpleReasoning(query);

        return NextResponse.json({
          success: true,
          reasoning: fallbackReasoning,
          source: 'fallback',
          requestId: requestId,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Query is not defined');
      }
    } catch (fallbackError) {
      console.error(`[${requestId}] Fallback reasoning also failed:`, fallbackError);
    }

    return NextResponse.json({
      success: false,
      error: 'Reasoning generation failed',
      message: error.message || 'Unknown error',
      requestId: requestId,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
