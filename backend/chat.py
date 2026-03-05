from openai import OpenAI

endpoint = "https://firsttimerschat1.openai.azure.com/openai/v1"
deployment_name = "gpt-4.1-nano"
api_key = "BKODepscxWslIBsfK9Ty9sBR6Vvrhj4CziEHmeEG1OkzkUoaIZ41JQQJ99CCACqBBLyXJ3w3AAABACOG34DF"

client = OpenAI(
    base_url=endpoint,
    api_key=api_key
)

completion = client.chat.completions.create(
    model=deployment_name,
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?",
        }
    ],
)

print(completion.choices[0].message)