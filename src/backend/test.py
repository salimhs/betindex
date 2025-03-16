from openai import OpenAI
import os

# Initialize OpenAI client with OpenRouter API details
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",  # The API base URL
  api_key=os.getenv('DEEPSEEK_API')  # Replace with your actual OpenRouter API key
)


completion = client.chat.completions.create(
    model="deepseek/deepseek-r1",
    messages=[
        {
            "role": "user",
            "content": "Perform a live internet search and provide me with the latest AI news from today."
        }
    ]
)



print(completion.choices[0].message.content)
