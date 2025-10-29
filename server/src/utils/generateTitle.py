# -*- coding: utf-8 -*-
import os
import sys
from dotenv import load_dotenv
from openai import OpenAI
import io

# Force UTF-8 stdout (fixes UnicodeEncodeError on Windows)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Check if a description was passed as argument
if len(sys.argv) < 2:
    print("Error: Please provide a detailed description so I can create a relevant and optimized title for you.")
    sys.exit(1)

# Define system prompt
SYSTEM_PROMPT = """
You are an AI assistant called Roshan, trained to generate short, catchy, and optimized YouTube video titles
based on the given video description. 
Each title should be clear, engaging, and help viewers quickly understand what the video is about.
Keep the title between 10–15 words or around 60–80 characters.
title should be generate in only english language which should be clear, engaging 
suggest only one title not more than one
"""

# Get user input (video description) from CLI argument
user_prompt = sys.argv[1]

# Call OpenAI API
response = client.chat.completions.create(
    model="gpt-5",  # your chosen model
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]
)

# Print the generated title

print(response.choices[0].message.content.strip())
