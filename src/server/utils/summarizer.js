import { OpenAI } from '@langchain/community/llms/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { config } from '../../config/config.js'

export async function summarizeText(text) {
  try {
    const apiKey = config.get('openai.apiKey')
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Initialize the OpenAI model
    const model = new OpenAI({
      modelName: 'gpt-3.5-turbo-instruct',
      openAIApiKey: apiKey,
      temperature: 0.3
    })

    // Create a prompt template for summarization
    const promptTemplate = PromptTemplate.fromTemplate(
      'Summarize the following document in a concise way, highlighting the key points:\n\n{text}'
    )

    // Create a chain for processing
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser())

    // Execute the chain with the text
    const summary = await chain.invoke({ text })

    return summary
  } catch (error) {
    console.error('Error summarizing text:', error)
    throw new Error(`Failed to summarize text: ${error.message}`)
  }
}
