// Import the OpenAI library
const OpenAI = require('openai');

// Create an instance of OpenAI and set your API key from environment variables
const openai = new OpenAI({
  apiKey: '',
});

async function getJobStatus(jobId) {
  try {
    // Retrieve the status of a fine-tuning job using the correct method
    const response = await openai.fineTuning.jobs.retrieve(jobId);
    console.log('Job Status:', response);
  } catch (error) {
    console.error('Error retrieving job status:', error);
  }
}

// Replace 'YOUR_JOB_ID' with the actual job ID you want to check
getJobStatus('');
