
export type TemplateEngine = 
  | 'Jinja2' 
  | 'Mako' 
  | 'Twig' 
  | 'Smarty' 
  | 'Freemarker' 
  | 'Velocity' 
  | 'Pug' 
  | 'EJS'
  | 'ERB'
  | 'Tornado';

export interface WafRestriction {
  id: string;
  label: string;
  description: string;
  blockedPattern: string;
}

export interface GeneratedPayload {
  engine: TemplateEngine;
  payload: string;
  explanation: string;
  bypassTechnique: string;
  pollutionChain: string[]; // Step-by-step introspection path
}

export interface PayloadRequest {
  engine: TemplateEngine;
  goal: string;
  specificCommand?: string; // Optional specific command to run
  restrictions: string[];
  customWafRules: string;
  blockedPatterns?: string; // New: Specific forbidden keywords or regex
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  request: PayloadRequest | CodeAnalysisRequest;
  response: GeneratedPayload | CodeAnalysisResponse;
  type: 'generator' | 'auditor';
}

export interface CodeAnalysisRequest {
  sourceCode: string;
  engine?: TemplateEngine;
}

export interface CodeAnalysisResponse {
  vulnerabilityFound: boolean;
  engineDetected: string;
  sinkPoint: string;
  pollutionChain: string[];
  suggestedPayloads: string[];
  remediation: string;
  description: string;
}
