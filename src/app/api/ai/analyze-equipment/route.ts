import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const inventoryAnalysisSchema = z.object({
  input: z.string().min(1, 'Product URL or description is required'),
  type: z.enum(['url', 'description']).default('description'),
  createMissingCategory: z.boolean().default(false),
  createMissingSubcategory: z.boolean().default(false),
});

// Define the structure we want Gemini to return
const equipmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  dailyRate: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'string') {
      // Remove currency symbols and parse
      const cleaned = val.replace(/[€$£,\s]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return val || 0;
  }).optional(),
  specifications: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  powerRequirements: z.string().optional(),
  connectivity: z.array(z.string()).optional(),
});

// Helper function to get appropriate icon for category
function getCategoryIcon(categoryName: string): string {
  const categoryLower = categoryName.toLowerCase();
  
  if (categoryLower.includes('audio')) return '🎵';
  if (categoryLower.includes('video')) return '📹';
  if (categoryLower.includes('lighting')) return '💡';
  if (categoryLower.includes('power')) return '🔌';
  if (categoryLower.includes('rigging')) return '🔗';
  if (categoryLower.includes('staging')) return '🎭';
  if (categoryLower.includes('cables')) return '🔌';
  if (categoryLower.includes('accessories')) return '🛠️';
  
  return '📦'; // Default icon
}

// Helper function to determine region context for pricing
function getRegionContext(timezone: string, language: string, currency: string): {
  region: string;
  market: string;
  competitors: string;
} {
  // Portugal / Spain / Iberian Peninsula
  if (timezone.includes('Lisbon') || timezone.includes('Madrid') || language === 'pt' || language === 'es' || currency === 'EUR') {
    if (timezone.includes('Lisbon') || language === 'pt') {
      return {
        region: 'Portugal',
        market: 'Portuguese and Iberian AV rental',
        competitors: 'Ambisom, Mundo Audiovisual, Europalco, Sonorização Portuguesa, Audiológica, Pixel Point, Sennheiser Ibérica partners'
      };
    }
    if (timezone.includes('Madrid') || language === 'es') {
      return {
        region: 'Spain',
        market: 'Spanish AV rental',
        competitors: 'Fluge, Stonex, Sonido e Imagen, Europalco Spain, DAS Audio rentals, Dushow España'
      };
    }
    return {
      region: 'Western Europe (Eurozone)',
      market: 'European AV rental',
      competitors: 'Europalco, PRG Europe, NEP Group, White Light, Stage Electrics, TSE AG'
    };
  }
  
  // UK
  if (timezone.includes('London') || language === 'en-GB' || currency === 'GBP') {
    return {
      region: 'United Kingdom',
      market: 'UK AV rental',
      competitors: 'PRG UK, White Light, Stage Electrics, HSL Group, Entec Sound & Light, Wigwam Acoustics'
    };
  }
  
  // Germany / DACH region
  if (timezone.includes('Berlin') || language === 'de' || currency === 'CHF') {
    return {
      region: 'Germany/DACH',
      market: 'German-speaking AV rental',
      competitors: 'Neumann&Müller, TSE AG, PRG Germany, Gahrens + Battermann, Ambion, Habegger'
    };
  }
  
  // France
  if (timezone.includes('Paris') || language === 'fr') {
    return {
      region: 'France',
      market: 'French AV rental',
      competitors: 'Dushow, Novelty Group, GL Events, MPM, Alive Audio, Magnum'
    };
  }
  
  // Netherlands / Benelux
  if (timezone.includes('Amsterdam') || language === 'nl') {
    return {
      region: 'Netherlands/Benelux',
      market: 'Benelux AV rental',
      competitors: 'Ampco Flashlight, Rent-All, Purple Group, Faces Events, Unlimited Productions'
    };
  }
  
  // USA
  if (timezone.includes('America') || currency === 'USD') {
    return {
      region: 'United States',
      market: 'US AV rental',
      competitors: 'PRG, 4Wall Entertainment, VER (NEP), WorldStage, PSAV, Freeman'
    };
  }
  
  // Brazil
  if (language === 'pt-BR') {
    return {
      region: 'Brazil',
      market: 'Brazilian AV rental',
      competitors: 'Gabisom, Loudness, Áudio Lux, Harman Brazil rentals, LD Sistemas'
    };
  }
  
  // Default - International
  return {
    region: 'International',
    market: 'global AV rental',
    competitors: 'PRG, NEP Group, Freeman, 4Wall Entertainment, major regional providers'
  };
}

// Helper function to call Gemini with retry across multiple API keys
async function callGeminiWithRetry(prompt: string): Promise<string> {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    throw new Error('No Gemini API key configured');
  }

  let lastError: Error | null = null;
  const delayMs = 1500; // 1.5 seconds delay between retries
  let triedKeys: string[] = [];

  for (const apiKey of apiKeys) {
    try {
      const keyShort = apiKey?.slice(0, 8) + '...' + apiKey?.slice(-4);
      triedKeys.push(keyShort);
      console.log('Trying Gemini API key:', keyShort);
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini 2.5 Flash - latest stable free tier model (June 2025)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      console.log('Sending request to Gemini (gemini-2.5-flash)...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = lastError.message;
      const keyShort = apiKey?.slice(0, 8) + '...' + apiKey?.slice(-4);
      console.error('Gemini API key failed:', keyShort, 'Error:', errorMsg);
      // If it's a quota error, try the next key after a delay
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Too Many Requests')) {
        console.log('Quota exceeded for this API key, waiting', delayMs, 'ms before trying next...');
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      // For other errors, throw immediately
      throw lastError;
    }
  }

  // All keys exhausted
  const keysTriedMsg = triedKeys.length ? ` Tried keys: ${triedKeys.join(', ')}` : '';
  throw new Error((lastError?.message || 'All API keys exhausted.') + keysTriedMsg);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('AI request received:', { type: body.type, inputLength: body.input?.length });
    
    const { input, type, createMissingCategory, createMissingSubcategory } = inventoryAnalysisSchema.parse(body);

    // Fetch company settings for location/currency context
    let companySettings = null;
    try {
      companySettings = await prisma.customizationSettings.findFirst({
        select: {
          companyName: true,
          currency: true,
          timezone: true,
          language: true,
        }
      });
    } catch (e) {
      console.log('Could not fetch company settings, using defaults');
    }

    // Determine currency and region from settings
    const currency = companySettings?.currency || 'EUR';
    const timezone = companySettings?.timezone || 'Europe/Lisbon';
    const language = companySettings?.language || 'pt';
    
    // Infer region from timezone/language for better pricing context
    const regionContext = getRegionContext(timezone, language, currency);

    let analysisPrompt = '';
    
    if (type === 'url') {
      analysisPrompt = `
        Analyze this product URL/link and extract equipment information: ${input}
        
        IMPORTANT PRICING CONTEXT:
        - Company Location/Region: ${regionContext.region}
        - Currency: ${currency}
        - Market: ${regionContext.market}
        
        Please provide the following information in JSON format:
        {
          "name": "Product name (max 80 characters)",
          "description": "Detailed description (max 400 characters)",
          "category": "Equipment category (Audio, Video, Lighting, etc.)",
          "subcategory": "Specific subcategory if applicable",
          "dailyRate": 50.00,
          "specifications": ["Key specifications as array"],
          "imageUrl": "Product image URL if available",
          "brand": "Brand name",
          "model": "Model number/name",
          "weight": "Weight with units",
          "dimensions": "Dimensions (L x W x H)",
          "powerRequirements": "Power specs",
          "connectivity": ["Connection types as array"]
        }
        
        CRITICAL FOR dailyRate:
        - dailyRate MUST be a NUMBER (e.g., 50.00, 125.50, 200), NOT a string
        - This is the daily rental rate in ${currency}
        - Research and estimate based on ${regionContext.region} AV rental market prices
        - Consider competitor rates from companies like: ${regionContext.competitors}
        - Use industry-standard rental pricing (typically 2-5% of equipment retail value per day)
        - High-end professional equipment commands premium rates
        
        PRICING GUIDELINES for ${regionContext.region}:
        - Research typical rental prices for this specific equipment
        - Factor in the local market conditions and currency (${currency})
        - Consider seasonal demand variations in the ${regionContext.market} market
        
        For category, use one of: Audio, Video, Lighting, Power, Rigging, Staging, Cables, Accessories
        
        CRITICAL: Keep name under 80 characters and description under 400 characters. dailyRate MUST be a number!
      `;
    } else {
      analysisPrompt = `
        Based on this equipment description, extract and format the information: ${input}
        
        IMPORTANT PRICING CONTEXT:
        - Company Location/Region: ${regionContext.region}
        - Currency: ${currency}
        - Market: ${regionContext.market}
        
        Please provide the following information in JSON format:
        {
          "name": "Product name (max 80 characters)",
          "description": "Enhanced detailed description (max 400 characters)",
          "category": "Equipment category (Audio, Video, Lighting, etc.)",
          "subcategory": "Specific subcategory if applicable",
          "dailyRate": 50.00,
          "specifications": ["Key specifications as array"],
          "imageUrl": "Product image URL if available",
          "brand": "Brand name if mentioned",
          "model": "Model number/name if mentioned",
          "weight": "Weight with units if mentioned",
          "dimensions": "Dimensions if mentioned",
          "powerRequirements": "Power specs if mentioned",
          "connectivity": ["Connection types as array if mentioned"]
        }
        
        CRITICAL FOR dailyRate:
        - dailyRate MUST be a NUMBER (e.g., 50.00, 125.50, 200), NOT a string
        - This is the daily rental rate in ${currency}
        - Research and estimate based on ${regionContext.region} AV rental market prices
        - Consider competitor rates from companies like: ${regionContext.competitors}
        - Use industry-standard rental pricing (typically 2-5% of equipment retail value per day)
        - High-end professional equipment commands premium rates
        
        PRICING GUIDELINES for ${regionContext.region}:
        - Research typical rental prices for this specific equipment
        - Factor in the local market conditions and currency (${currency})
        - Consider the ${regionContext.market} market conditions
        
        For category, use one of: Audio, Video, Lighting, Power, Rigging, Staging, Cables, Accessories
        Fill in reasonable details even if not explicitly mentioned in the description.
        
        CRITICAL: Keep name under 80 characters and description under 400 characters. dailyRate MUST be a number!
      `;
    }

    // Call Gemini with retry logic
    const text = await callGeminiWithRetry(analysisPrompt);
    console.log('Gemini response received, length:', text.length);

    let equipmentData;
    try {
      // Try to parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        equipmentData = JSON.parse(jsonMatch[0]);
        console.log('Parsed equipment data:', equipmentData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse equipment information from AI response', details: text },
        { status: 500 }
      );
    }

    // Validate the response against our schema
    const validatedData = equipmentSchema.parse(equipmentData);
    
    console.log('Validated dailyRate:', validatedData.dailyRate, 'type:', typeof validatedData.dailyRate);

    // Ensure description fits within form limits
    if (validatedData.description && validatedData.description.length > 450) {
      validatedData.description = validatedData.description.substring(0, 447) + '...';
    }
    
    // Ensure name fits within form limits  
    if (validatedData.name && validatedData.name.length > 90) {
      validatedData.name = validatedData.name.substring(0, 87) + '...';
    }

    // Handle category and subcategory checking and optional creation
    let categoryInfo = null;
    let subcategoryInfo = null;
    let needsNewCategory = false;
    let needsNewSubcategory = false;
    let createdCategory = false;
    let createdSubcategory = false;

    if (validatedData.category) {
      try {
        // Check if category exists
        let existingCategory = await prisma.category.findFirst({
          where: {
            name: {
              equals: validatedData.category
            }
          }
        });

        if (!existingCategory) {
          needsNewCategory = true;
          
          // Create category if user confirmed
          if (createMissingCategory) {
            existingCategory = await prisma.category.create({
              data: {
                name: validatedData.category,
                icon: getCategoryIcon(validatedData.category)
              }
            });
            createdCategory = true;
            console.log(`Created new category: ${validatedData.category}`);
          }
        }

        if (existingCategory) {
          categoryInfo = existingCategory;

          // Handle subcategory if provided
          if (validatedData.subcategory) {
            let existingSubcategory = await prisma.subcategory.findFirst({
              where: {
                name: {
                  equals: validatedData.subcategory
                },
                parentId: existingCategory.id
              }
            });

            if (!existingSubcategory) {
              needsNewSubcategory = true;
              
              // Create subcategory if user confirmed
              if (createMissingSubcategory) {
                existingSubcategory = await prisma.subcategory.create({
                  data: {
                    name: validatedData.subcategory,
                    parentId: existingCategory.id
                  }
                });
                createdSubcategory = true;
                console.log(`Created new subcategory: ${validatedData.subcategory} under ${validatedData.category}`);
              }
            }

            if (existingSubcategory) {
              subcategoryInfo = existingSubcategory;
            }
          }
        }
      } catch (dbError) {
        console.error('Database error during category operations:', dbError);
        // Continue without failing the entire request
      }
    }

    return NextResponse.json({
      success: true,
      equipment: validatedData,
      categoryInfo: categoryInfo ? {
        id: categoryInfo.id,
        name: categoryInfo.name,
        created: createdCategory
      } : null,
      subcategoryInfo: subcategoryInfo ? {
        id: subcategoryInfo.id,
        name: subcategoryInfo.name,
        created: createdSubcategory
      } : null,
      needsNewCategory,
      needsNewSubcategory,
      suggestedCategoryName: needsNewCategory ? validatedData.category : null,
      suggestedSubcategoryName: needsNewSubcategory ? validatedData.subcategory : null,
      rawResponse: text, // For debugging
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle rate limit / quota errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      return NextResponse.json(
        { 
          error: 'AI service quota exceeded. Please try again later or contact administrator.',
          details: 'The Gemini API free tier limit has been reached. Try again in a few minutes or upgrade your API plan.'
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes('No Gemini API key configured')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to analyze equipment information', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
