
// Add more robust error logging at the start of the function
console.log('Starting document processing');
console.log('OpenAI API Key present:', !!Deno.env.get('OPENAI_API_KEY'));
console.log('Pinecone API Key present:', !!Deno.env.get('PINECONE_API_KEY'));
