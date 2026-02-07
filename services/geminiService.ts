import { GoogleGenAI, Type } from "@google/genai";
import { PayloadRequest, GeneratedPayload, CodeAnalysisRequest, CodeAnalysisResponse } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSSTIPayload = async (req: PayloadRequest): Promise<GeneratedPayload> => {
  const prompt = `
    As a world-class cybersecurity researcher specializing in Template Injection, generate a highly optimized SSTI payload for the following scenario:
    
    [SCENARIO]
    - Template Engine: ${req.engine}
    - Primary Goal: ${req.goal}
    ${req.specificCommand ? `- Specific Command to Execute: ${req.specificCommand}` : ''}
    - Active WAF Restrictions: ${req.restrictions.join(', ')}
    - Additional WAF Behavior: ${req.customWafRules}
    ${req.blockedPatterns ? `- STRICTLY FORBIDDEN PATTERNS: ${req.blockedPatterns}` : ''}

    [REQUIREMENTS]
    1. PAYLOAD: Provide a working payload string. If a specific command was provided, it MUST be integrated. 
       CRITICAL: The payload MUST NOT contain any of the "STRICTLY FORBIDDEN PATTERNS". Use bypass techniques like string concatenation, base64, hex encoding, or attribute retrieval (e.g., attr(), getitem) to avoid them.
    2. BYPASS TECHNIQUE: Identify the specific method used to evade the WAF. (Must respond in Chinese)
    3. POLLUTION CHAIN: Provide a step-by-step array of the object hierarchy or "pollution chain" used to reach the target function.
    4. EXPLANATION: Deep technical explanation of why this specific chain works and how it evades the defined blocks. (Must respond in Chinese)

    Ensure the payload is sophisticated. If 'dots' are blocked, use bracket notation. If 'underscores' are blocked, use hex/unicode encoding.
    
    Return the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          engine: { type: Type.STRING },
          payload: { type: Type.STRING },
          explanation: { type: Type.STRING },
          bypassTechnique: { type: Type.STRING },
          pollutionChain: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "The introspection sequence from the starting object to the execution sink."
          }
        },
        required: ["engine", "payload", "explanation", "bypassTechnique", "pollutionChain"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as GeneratedPayload;
};

export const analyzeSourceCode = async (req: CodeAnalysisRequest): Promise<CodeAnalysisResponse> => {
  const prompt = `
    你是一名顶级安全审计专家和静态代码分析（SAST）系统架构师。你的任务是从给定的源代码中精确识别 SSTI 漏洞。

    [深度追踪准则]
    1. **识别隐藏污染源**: 检查不仅限于 request.args，还包括 Headers、Cookies、JSON Body、甚至是数据库查询结果或本地配置文件中被二次渲染的变量。
    2. **追踪链式赋值（Chained Assignments）**: 必须追踪变量重命名过程。例如：x = req.arg -> y = x -> z = f"{y}" -> render(z)。即便经过多次转换，也要识别出原始污点。
    3. **处理间接函数调用（Indirect Calls）**: 识别包装函数。如果代码调用了 render_custom(content)，而 render_custom 内部使用了 render_template_string(content)，必须穿透该函数。
    4. **上下文感知渲染**: 识别数据是否在模板的危险上下文中渲染（例如：在 HTML 属性中、在 script 标签内、或直接作为模板字符串解析）。

    [分析逻辑]
    - 输入源 (Sources) -> 变量流转 (Flows) -> 数据清洗 (Sanitizers, 检查是否有转义) -> 最终汇聚点 (Sinks)。

    [待审计源码]
    ${req.sourceCode}

    [输出要求]
    - 以 JSON 格式返回结果。
    - remediation, description 字段必须使用中文，且要体现对链式逻辑的深度理解。
    - pollutionChain 必须详细列出变量转换的每一步。
    - suggestedPayloads 必须是针对代码中特定绕过逻辑（如 WAF 或特定过滤器）的有效 PoC。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 12000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vulnerabilityFound: { type: Type.BOOLEAN },
          engineDetected: { type: Type.STRING },
          sinkPoint: { type: Type.STRING, description: "发生漏洞的精确代码行或函数调用位置。" },
          pollutionChain: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "从输入源到汇聚点的完整数据流路径，包含所有的中间赋值。格式：[Source] -> [Var A] -> [Var B] -> [Sink]"
          },
          suggestedPayloads: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "针对此漏洞的测试 Payload。"
          },
          remediation: { type: Type.STRING, description: "修复建议（中文）。" },
          description: { type: Type.STRING, description: "漏洞的深度技术分析（中文）。" }
        },
        required: ["vulnerabilityFound", "engineDetected", "sinkPoint", "pollutionChain", "suggestedPayloads", "remediation", "description"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as CodeAnalysisResponse;
};