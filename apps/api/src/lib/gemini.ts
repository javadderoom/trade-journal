import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'no_key_provided';
const proxyUrl = process.env.GEMINI_PROXY_URL;

export const gemini = new GoogleGenerativeAI(apiKey);

/**
 * Returns a configured Gemini model instance.
 * Automatically injects the Cloudflare proxy URL if it exists in the environment.
 */
export const getGeminiModel = (modelName: string = 'gemini-3.6-flash') => {
  const requestOptions: any = {};
  
  if (proxyUrl) {
    requestOptions.baseUrl = proxyUrl;
    
    // Some older versions of the SDK prefer a custom fetch for proxying:
    requestOptions.customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = input.toString();
      const targetUrl = new URL(url);
      const proxy = new URL(proxyUrl);
      
      targetUrl.protocol = proxy.protocol;
      targetUrl.host = proxy.host;
      if (proxy.pathname !== '/') {
        targetUrl.pathname = proxy.pathname.replace(/\/$/, '') + targetUrl.pathname;
      }
      
      return fetch(targetUrl.toString(), init);
    };
  }
  
  return gemini.getGenerativeModel({ model: modelName }, requestOptions);
};
