export const runtime = {
  conversationMode: import.meta.env.VITE_CONVERSATION_MODE || 'mock',
  ttsEndpoint: import.meta.env.VITE_ELEVENLABS_TTS_ENDPOINT || '',
  cxas: {
    deploymentName: import.meta.env.VITE_CXAS_DEPLOYMENT_NAME || '',
    projectId: import.meta.env.VITE_CXAS_PROJECT_ID || '',
    location: import.meta.env.VITE_CXAS_LOCATION || '',
    appId: import.meta.env.VITE_CXAS_APP_ID || '',
    agentId: import.meta.env.VITE_CXAS_AGENT_ID || '',
    endpoint: import.meta.env.VITE_CXAS_ENDPOINT || '',
  },
};
