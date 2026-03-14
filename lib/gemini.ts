"use client";
import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeProductWithGemini(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  const base64Data = base64Image.split(",")[1];
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.OBJECT,
        properties: {
          primary: { type: Type.STRING },
          sub: { type: Type.STRING },
          productType: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          usageCategory: { type: Type.STRING },
          alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      deliveryPrediction: {
        type: Type.OBJECT,
        properties: {
          predictions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                imageNumber: { type: Type.STRING },
                borderType: { type: Type.STRING },
                deliveryCategory: { type: Type.STRING },
                deliveryLevel: { type: Type.STRING },
                confidenceScore: { type: Type.NUMBER }
              }
            }
          },
          bestLayout: { type: Type.STRING }
        }
      },
      listings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      trendingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      ctrAnalysis: {
        type: Type.OBJECT,
        properties: {
          imageScores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                imageNumber: { type: Type.NUMBER },
                borderSize: { type: Type.STRING },
                gradientStyle: { type: Type.STRING },
                visibilityScore: { type: Type.NUMBER },
                visualAppealScore: { type: Type.NUMBER },
                ctrScore: { type: Type.NUMBER },
                overallScore: { type: Type.NUMBER }
              }
            }
          },
          top3Images: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          winningImage: { type: Type.NUMBER },
          ctrOptimized: {
            type: Type.OBJECT,
            properties: {
              reason: { type: Type.STRING },
              expectedPerformance: { type: Type.STRING }
            }
          },
          performanceSummary: {
            type: Type.OBJECT,
            properties: {
              bestImage: { type: Type.STRING },
              bestBackground: { type: Type.STRING },
              bestBorderSize: { type: Type.STRING },
              bestGradient: { type: Type.STRING },
              bestLayout: { type: Type.STRING },
              improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      },
      competitorPricingAnalysis: {
        type: Type.OBJECT,
        properties: {
          top5Competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                marketplace: { type: Type.STRING },
                productPrice: { type: Type.NUMBER },
                deliveryCharge: { type: Type.NUMBER },
                finalPrice: { type: Type.NUMBER }
              }
            }
          },
          priceComparison: {
            type: Type.OBJECT,
            properties: {
              averageProductPrice: { type: Type.NUMBER },
              lowestPrice: { type: Type.NUMBER },
              highestPrice: { type: Type.NUMBER },
              averageDeliveryCharge: { type: Type.NUMBER }
            }
          },
          priceRecommendation: {
            type: Type.OBJECT,
            properties: {
              recommendedListingPrice: { type: Type.NUMBER },
              recommendedCompetitivePriceRange: { type: Type.STRING }
            }
          }
        }
      },
      productDimensions: {
        type: Type.OBJECT,
        properties: {
          averageLength: { type: Type.NUMBER },
          averageWidth: { type: Type.NUMBER },
          averageHeight: { type: Type.NUMBER },
          unit: { type: Type.STRING }
        }
      },
      packageDimensions: {
        type: Type.OBJECT,
        properties: {
          recommendedLength: { type: Type.NUMBER },
          recommendedWidth: { type: Type.NUMBER },
          recommendedHeight: { type: Type.NUMBER },
          estimatedShippingWeight: { type: Type.NUMBER },
          dimensionUnit: { type: Type.STRING },
          weightUnit: { type: Type.STRING }
        }
      },
      taxInfo: {
        type: Type.OBJECT,
        properties: {
          hsnCode: { type: Type.STRING },
          gstRate: { type: Type.NUMBER }
        }
      }
    }
  };

  const prompt = `You are an advanced AI ecommerce tool builder specialized in creating listing assets for the Meesho marketplace.
Analyze this product image and generate the following FOR THE CURRENT UPLOADED PRODUCT ONLY. Do not generate information for past or generic products:
1. Product Category Detection: Primary, Sub, Type, Audience, Usage, and 5 alternative suggestions.
2. Meesho Delivery Charge Predictor: Estimate delivery category for 6 different image groups (Group A 2mm, Group B 4mm, Group C 6mm, Group D 8mm, Group E 10mm, Group F Border+Stickers). Provide 6 predictions in the array. Also state the best layout for lowest delivery cost.
3. Auto Product Listing Generator: Generate exactly 35 distinct listings FOR THIS EXACT PRODUCT. Each must have a Title (80-120 chars), Description (4-5 bullet points covering material, style, comfort, occasions, care), and 20 SEO Keywords.
4. Auto Product Tag Generator: Generate exactly 30 tags for this product.
5. Trend Search Keywords: Generate exactly 20 trending ecommerce search phrases used by shoppers for this product.
6. AI Winning First Image Selector: Evaluate 35 images (5 of 2mm, 5 of 4mm, 5 of 6mm, 5 of 8mm, 5 of 10mm, 10 of stickers). Assign scores (1-10) for visibility, visual appeal, CTR, and overall. Identify Top 3 and the Winning First Image.
7. Meesho CTR Optimized Image Generator: Provide the reason why the CTR optimized version performs best and its expected performance level.
8. Visual Listing Performance Summary: Return best image, background, border size, gradient, layout, and tips for improving CTR.
9. Competitor Pricing and Delivery Analysis: Analyze similar competitor products for the CURRENT uploaded product. Search across marketplaces: Meesho, Amazon, Flipkart. Extract: Product Title, Product Price, Delivery Charge, Final Price (Price + Delivery) for at least Top 5 competitor listings. Calculate: Average Product Price, Lowest Price, Highest Price, Average Delivery Charge. Determine: Recommended Listing Price, Recommended Competitive Price Range.
10. Dimensions and Weight: Calculate the average product dimensions (length, width, height) based on competitor data. Also, provide recommended package dimensions and estimated shipping weight.
11. Tax Information: Detect the correct HSN code and GST rate for this product category in India.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.7,
    }
  });

  return JSON.parse(response.text || "{}");
}
