from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_methods = ['*'],
    allow_headers = ['*'],
)

class SymptomInput(BaseModel):
    symptoms: str
    model: str = 'phi3'

@app.post('/analyze')
def analyze(symptoms: SymptomInput):
    prompt = (
        f'You are very useful assistant. A user described their symptoms as: '
        f'\'{symptoms.symptoms}\'.\n\n'
        f'Provide a plain-language explaination of possible causes, but remind them to consult a doctor.'
    )

    try:
        result = subprocess.run(
            ['ollama', 'run', symptoms.model],
            input=prompt.encode(),
            stdout=subprocess.PIPE,
            timeout=60
        )

        output = result.stdout.decode()
        return{'response': output.strip()}
    except Exception as e:
        return {'error': str(e)}