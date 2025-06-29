import { useState, useCallback } from 'react';
import { Groq } from 'groq-sdk';

export const useAIAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Initialize Groq client
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const groq = new Groq({
    apiKey: groqKey,
    dangerouslyAllowBrowser: true
  });

  // Transform contract data to AI-expected format
  const transformDataForAI = (userAddress, portfolio, positions, reserveData, userMetrics) => {
    return {
      userAddress: userAddress || "0x0000000000000000000000000000000000000000",
      portfolio: {
        ironBalance: portfolio?.ironBalance || "0",
        tokenDeposited: portfolio?.tokenDeposited || "0x0000000000000000000000000000000000000000",
        withdrawn: portfolio?.withdrawn || "0",
        allowedWithdrawalTimestamp: portfolio?.allowedWithdrawalTimestamp || 0
      },
      positions: positions || [],
      reserveData: {
        currentPrice: reserveData?.reservePrice || "0",
        priceHistory: reserveData?.priceHistory || [],
        oracleFeed: "Chainlink BTC.b",
        lastUpdated: new Date().toISOString()
      },
      marketData: {
        userMetrics: {
          currentBalance: userMetrics?.currentBalance || 0,
          totalDeposited: userMetrics?.totalDeposited || 0,
          totalGain: userMetrics?.totalGain || 0,
          gainPercentage: userMetrics?.gainPercentage || 0,
          activePositions: userMetrics?.activePositions || 0,
          closedPositions: userMetrics?.closedPositions || 0,
          canWithdraw: userMetrics?.canWithdraw || false,
          withdrawalTimeLeft: userMetrics?.withdrawalTimeLeft || 0
        },
        timestamp: new Date().toISOString()
      }
    };
  };

  // Generate AI analysis
  const generateAnalysis = useCallback(async (
    analysisType,
    userAddress,
    portfolio,
    positions,
    reserveData,
    userMetrics
  ) => {
    if (!groqKey) {
      setError('Groq API key not configured');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform data
      const aiInputData = transformDataForAI(
        userAddress,
        portfolio,
        positions,
        reserveData,
        userMetrics
      );

      // System prompt for DeFi analytics
      const systemPrompt = `You are an expert DeFi protocol analyst specializing in synthetic token systems, reserve-backed protocols, and automated risk management. Your primary function is to analyze Ironic Protocol data and provide actionable insights through structured JSON responses.

CRITICAL: You MUST always respond with a valid JSON object. Do not include any text outside the JSON structure.

You must analyze the provided data and return insights about the user's DeFi portfolio performance, risks, and opportunities.

Focus on:
- Portfolio health and performance metrics
- Risk assessment and mitigation strategies  
- Position analysis and optimization
- Market context and timing recommendations
- Actionable next steps for the user

Provide specific, quantified insights with confidence scores and clear recommendations.`;

      // Create analysis prompt based on type
      const analysisPrompts = {
        portfolio: "Analyze the overall portfolio performance, health, and provide optimization recommendations.",
        risk: "Conduct a comprehensive risk assessment focusing on concentration, liquidity, and market risks.",
        positions: "Analyze individual positions, stop-loss effectiveness, and position-specific recommendations.",
        opportunities: "Identify yield enhancement and capital efficiency opportunities.",
        market: "Provide market context analysis and timing recommendations."
      };

      const userPrompt = `${analysisPrompts[analysisType] || analysisPrompts.portfolio}

Analysis Type: ${analysisType}
User Data: ${JSON.stringify(aiInputData, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "analysisType": "${analysisType}",
  "timestamp": "${new Date().toISOString()}",
  "userAddress": "${userAddress}",
  "executiveSummary": {
    "text": "2-3 sentence summary",
    "severity": "low|medium|high",
    "confidence": 0.0-1.0
  },
  "metrics": {
    "portfolioHealthScore": 0-100,
    "riskScore": 0-100,
    "apy": 0.0-999.9,
    "totalReturn": number,
    "diversificationScore": 0-100,
    "liquidityScore": 0-100,
    "automationUtilization": 0-100
  },
  "keyInsights": [
    {
      "type": "performance|risk|opportunity|warning",
      "priority": "high|medium|low",
      "title": "Insight title",
      "description": "Detailed description",
      "impact": "positive|negative|neutral",
      "confidence": 0.0-1.0
    }
  ],
  "recommendations": [
    {
      "type": "action|strategy|optimization|protection",
      "priority": "immediate|high|medium|low",
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "expectedImpact": "high|medium|low",
      "timeframe": "immediate|1-7days|1-4weeks|1-3months",
      "complexity": "simple|moderate|complex"
    }
  ],
  "alerts": [
    {
      "type": "critical|warning|info",
      "message": "Alert message",
      "actionRequired": boolean
    }
  ]
}`;

      // Call Groq API
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_completion_tokens: 2048,
      });

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response from AI");
      }

      // Parse response
      const responseContent = completion.choices[0].message.content;
      console.log("AI Analysis Response:", responseContent);

      let analysisResult;
      try {
        analysisResult = JSON.parse(responseContent);
        setLastAnalysis(analysisResult);
        return analysisResult;
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        throw new Error("Failed to parse AI analysis");
      }

    } catch (error) {
      console.error("AI Analysis Error:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [groqKey]);

  // Quick analysis for dashboard
  const generateQuickAnalysis = useCallback(async (userAddress, portfolio, positions, reserveData, userMetrics) => {
    return generateAnalysis('portfolio', userAddress, portfolio, positions, reserveData, userMetrics);
  }, [generateAnalysis]);

  // Risk analysis for portfolio
  const generateRiskAnalysis = useCallback(async (userAddress, portfolio, positions, reserveData, userMetrics) => {
    return generateAnalysis('risk', userAddress, portfolio, positions, reserveData, userMetrics);
  }, [generateAnalysis]);

  return {
    generateAnalysis,
    generateQuickAnalysis,
    generateRiskAnalysis,
    loading,
    error,
    lastAnalysis
  };
};